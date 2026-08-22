import {NextFunction, Request, Response} from "express";
import Stripe from "stripe";
import redis from "../../../../packages/libs/redis";
import prisma from "../../../../packages/libs/primsa";
import { NotFoundError, ValidationError } from "../../../../packages/error-handler";
import { Prisma } from "@prisma/client";
import { sendEmail } from "../utils/send-email/index";
import { logAsync } from "../../../../packages/utils/logs/send-logs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia'
});

// Mirrors the shop_settings defaults in getShopSettings and the Prisma schema:
// a shop with no settings row still gets warned somewhere sensible.
const DEFAULT_LOW_STOCK_THRESHOLD = 10;
const DEFAULT_NOTIFICATION_CHANNELS = { email: true, web: true, app: false };


async function getAccountCapabilities(accountId: string) {
  const acct = await stripe.accounts.retrieve(accountId);
  return {
    acct,
    transfersStatus: acct.capabilities?.transfers,
    cardPaymentsStatus: acct.capabilities?.card_payments,
  };
}

async function createPIWithFallback({
  amountInCents,
  sellerAccountId,
  platformFeeInCents,
  metadata,
}: {
  amountInCents: number;
  sellerAccountId: string;
  platformFeeInCents: number;
  metadata?: Record<string, string>;
}) {
  const { transfersStatus } = await getAccountCapabilities(sellerAccountId);
  if (transfersStatus === "active") {
    // Destination charge: the intent lives on the PLATFORM account, so Stripe.js
    // must run in the platform context (no stripeAccount option on the client).
    const pi = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      application_fee_amount: platformFeeInCents,
      transfer_data: { destination: sellerAccountId },
      on_behalf_of: sellerAccountId,
      metadata,
    });
    return { pi, scope: "platform" as const };
  }
  // Direct charge: the intent lives on the CONNECTED account, so the client must
  // pass `stripeAccount` or it will look for the intent in the wrong place.
  const pi = await stripe.paymentIntents.create(
    {
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      application_fee_amount: platformFeeInCents,
      metadata,
    },
    { stripeAccount: sellerAccountId }
  );
  return { pi, scope: "connected" as const };
}

/**
 * A brand-new session is just a cart someone may never pay for, so it expires
 * quickly and does not accumulate.
 */
const SESSION_TTL_SECONDS = 10 * 60; // 10 minutes

/**
 * Once a PaymentIntent exists, the session is money in flight rather than an
 * abandoned cart — and it holds the only copy of what was bought.
 *
 * Stripe retries a failed webhook with backoff for up to three days. At the old
 * flat 10-minute TTL every one of those retries arrived to find the session
 * gone, so a webhook that was merely late meant a customer had paid for an order
 * that could never be created. The window now outlives the retries.
 */
const IN_FLIGHT_TTL_SECONDS = 3 * 24 * 60 * 60; // 3 days

export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
 const { amount, sellerStripeAccountId, sessionId } = req.body;
  const customerAmount = Math.round(amount * 100);
  const platformFee = Math.floor(customerAmount * 0.1);
  try {
    const { pi, scope } = await createPIWithFallback({
      amountInCents: customerAmount,
      sellerAccountId: sellerStripeAccountId,
      platformFeeInCents: platformFee,
      metadata: { sessionId, userId: String(req.user.id) },
    });

    /*
      Extended only now, not at session creation: this is the first moment a
      webhook can be expected for it. Failing to extend must not fail a payment
      intent that Stripe has already accepted, so it logs rather than throws.
    */
    if (sessionId) {
      await redis
        .expire(`payment-session:${sessionId}`, IN_FLIGHT_TTL_SECONDS)
        .catch((e: any) =>
          logAsync({
            type: "error",
            message: `Could not extend payment session ${sessionId}: ${e?.message}`,
          })
        );
    }

    res.send({ clientSecret: pi.client_secret, scope });
  } catch (err) {
    return next(err);
  }
}

export const createPaymentSession = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cart, selectedAddressId, coupon } = req.body;
    const userId = req.user.id;

    if (!cart || !Array.isArray(cart) || cart.length === 0)
      return next(new ValidationError("Invalid request data", "Cart is empty or invalid"));

    const normalizedCart = JSON.stringify(
      cart
        .map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          sale_price: item.sale_price,
          shopId: item.shopId,
          selectedOptions: item.selectedOptions || {},
        }))
        .sort((a, b) => a.id.localeCompare(b.id))
    );

    const keys = await redis.keys("payment-session");
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        if (session.userId === userId) {
          const existingCart = JSON.stringify(
            session.cart
              .map((item: any) => ({
                id: item.id,
                quantity: item.quantity,
                sale_price: item.sale_price,
                shopId: item.shopId,
                selectedOptions: item.selectedOptions || {},
              }))
              .sort((a: any, b: any) => a.id.localeCompare(b.id))
          );
          if (existingCart === normalizedCart)
            return res.status(200).json({ sessionId: key.split(":")[1] });
          else redis.del(key);
        }
      }
    }

    const uniqueShopIds = [...new Set(cart.map((item: any) => item.shopId))];
    const shops = await prisma.shops.findMany({
      where: { id: { in: uniqueShopIds } },
      select: {
        id: true,
        sellerId: true,
        sellers: {
          select: {
            stripeId: true,
          },
        },
      },
    });

    const sellerData = shops.map((shop: any) => ({
      shopId: shop.id,
      sellerId: shop.sellerId,
      stripeAccountId: shop?.sellers?.stripeId,
    }));

    const totalAmount = cart.reduce((total: number, item: any) => {
      return total + item.quantity * item.sale_price;
    }, 0);

    const sessionId = crypto.randomUUID();
    const sessionData = {
      userId,
      cart,
      sellers: sellerData,
      totalAmount,
      shippingAddressId: selectedAddressId || null,
      coupon: coupon || null,
    };

    await redis.setex(
      `payment-session:${sessionId}`,
      SESSION_TTL_SECONDS,
      JSON.stringify(sessionData)
    );

    logAsync({ type: "info", message: `Payment session ${sessionId} created for user ${userId}` });

    return res.status(201).json({ sessionId });
  } catch (err) {
    return next(err);
  }
};

export const verifyPaymentSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.query.sessionId;
    if (!sessionId)
      return res.status(400).json({ error: "Session ID is required!" });

    const sessionKey = `payment-session:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData)
      return res.status(404).json({ error: "Session not found or expired!" });

    const session = JSON.parse(sessionData);

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (err) {
    return next(err);
  }
};

// Orders are created asynchronously by the Stripe webhook, so the success page
// polls this until they show up (or until it gives up and tells the user to
// check their profile). Scoped to req.user so one customer can't read another's
// order by guessing a session id.
export const getOrderBySession = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId)
      throw new ValidationError("Invalid request data", "Session ID is required");

    const orders = await prisma.orders.findMany({
      where: { sessionId, userId },
      select: {
        id: true,
        total: true,
        status: true,
        deliveryStatus: true,
        shopId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    return next(err);
  }
};

export const createOrder = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let userId: string;
    let sessionId: string;
    const isWebhook = !!req.headers["stripe-signature"];
    if (isWebhook) {
      const stripeSignature = req.headers["stripe-signature"];
      const rawBody = (req as any).rawBody;

      if (!stripeSignature || !rawBody) {
        throw new ValidationError("Invalid request data","Missing Stripe signature or raw body");
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          stripeSignature,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
        console.log("✅ Stripe event verified:", event.type);
      } catch (err: any) {
        throw new ValidationError("Invalid request data", `Webhook Error: ${err.message}`);
      }

      if (event.type !== "payment_intent.succeeded") {
        return res.status(200).json({ received: true });
      }

      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      sessionId = paymentIntent.metadata?.sessionId;
      userId = paymentIntent.metadata?.userId;

      if (!sessionId || !userId) {
        throw new ValidationError("Invalid request data", "Missing sessionId or userId in metadata");
      }
    } else {
      userId = req.user?.id;
      sessionId = req.body.sessionId;

      if (!userId)
        throw new ValidationError("Invalid request data", "User ID missing in token context");
      if (!sessionId) throw new ValidationError("Invalid request data", "Session ID is required");
    }

    const sessionKey = `payment-session:${sessionId}`;
    const sessionData = await redis.get(sessionKey);
    if (!sessionData)
      throw new ValidationError("Invalid request data", "Payment session not found or expired");

    const { cart, totalAmount, shippingAddressId, coupon } =
      JSON.parse(sessionData);
    if (!Array.isArray(cart) || cart.length === 0)
      throw new ValidationError("Invalid request data", "Cart data missing or invalid");

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new ValidationError("Invalid request data", "User not found");
    const { name, email } = user;
    const shopGrouped = cart.reduce((acc: any, item: any) => {
      if (!acc[item.shopId]) acc[item.shopId] = [];
      acc[item.shopId].push(item);
      return acc;
    }, {});
    // A cart spanning several shops becomes several orders, and each one gets
    // its own tracking page — so the buyer's notification needs to know which
    // order id belongs to which shop.
    const orderIdByShop: Record<string, string> = {};

    /*
      Each shop sets its own low-stock threshold under Settings → General, and
      a shop that has never opened that page has no row at all — hence the
      defaults below, which mirror the ones getShopSettings serves.

      Read once for the whole cart rather than per product: a ten-item order
      from one shop needs one query, not ten.
    */
    const shopSettings = await prisma.shop_settings.findMany({
      where: { shopId: { in: Object.keys(shopGrouped) } },
      select: { shopId: true, lowStockThreshold: true, notifications: true },
    });
    const settingsByShop = new Map(shopSettings.map((s) => [s.shopId, s]));
    const lowStockByShop: Record<string, { title: string; stock: number }[]> =
      {};

    for (const shopId in shopGrouped) {
      const orderItems = shopGrouped[shopId];
      let orderTotal = orderItems.reduce(
        (sum: number, item: any) =>
          sum + Number(item.quantity) * Number(item.sale_price),
        0
      );

      if (coupon && coupon.discountProductId) {
        const discountItem = orderItems.find(
          (i: any) => i.id === coupon.discountProductId
        );
        if (discountItem) {
          const discount =
            coupon.discountPercent && coupon.discountPercent > 0
              ? (discountItem.sale_price *
                  discountItem.quantity *
                  coupon.discountPercent) /
                100
              : coupon.discountAmount || 0;
          orderTotal -= discount;
        }
      }

      const order = await prisma.orders.create({
        data: {
          userId,
          shopId,
          total: orderTotal,
          sessionId,
          status: "Paid",
          shippingAddressId: shippingAddressId || null,
          couponCode: coupon?.code || null,
          discountAmount: coupon?.discountAmount || 0,
          items: {
            create: orderItems.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.sale_price,
              selectedOptions: item.selectedOptions,
            })),
          },
        },
      });
      orderIdByShop[shopId] = order.id;

      for (const item of orderItems) {
        const { id: productId, quantity } = item;

        const updatedProduct = await prisma.products.update({
          where: { id: productId },
          data: {
            stock: { decrement: quantity },
            totalSales: { increment: quantity },
          },
          select: { title: true, stock: true },
        });

        /*
          Notify on the crossing, not on the state. Testing `stock <= threshold`
          on its own would fire again on every later sale while stock stayed
          low, and a warning that repeats on every order is one the seller
          learns to ignore — the one thing a stock warning cannot afford.
        */
        const threshold =
          settingsByShop.get(shopId)?.lowStockThreshold ??
          DEFAULT_LOW_STOCK_THRESHOLD;
        const stockBefore = updatedProduct.stock + Number(quantity);

        if (stockBefore > threshold && updatedProduct.stock <= threshold) {
          (lowStockByShop[shopId] ??= []).push({
            title: updatedProduct.title,
            stock: updatedProduct.stock,
          });
        }

        await prisma.productAnalytics.upsert({
          where: { productId },
          create: {
            productId,
            shopId,
            purchases: quantity,
            lastViewedAt: new Date(),
          },
          update: {
            purchases: { increment: quantity },
          },
        });

        const existingAnalytics = await prisma.userAnalytics.findUnique({
          where: { userId },
        });

        const newAction = {
          productId,
          shopId,
          action: "purchase",
          timeStamp: Date.now(),
        };

        const currentActions = Array.isArray(existingAnalytics?.actions)
          ? (existingAnalytics.actions as Prisma.JsonArray)
          : [];

        if (existingAnalytics) {
          await prisma.userAnalytics.update({
            where: { userId },
            data: {
              lastVisited: new Date(),
              actions: [...currentActions, newAction],
            },
          });
        } else {
          await prisma.userAnalytics.create({
            data: {
              userId,
              lastVisited: new Date(),
              actions: [newAction],
            },
          });
        }
      }
    }

    await sendEmail(
      email,
      "Your Eshop Order Confirmation",
      "order-confirmation",
      {
        name,
        cart,
        totalAmount:
          coupon?.discountAmount && totalAmount > coupon.discountAmount
            ? totalAmount - coupon.discountAmount
            : totalAmount,
        trackingUrl: `https://eshop.com/order/${sessionId}`,
      }
    );
    const createdShopIds = Object.keys(shopGrouped);
    const sellerShops = await prisma.shops.findMany({
      where: { id: { in: createdShopIds } },
      select: { id: true, sellerId: true, name: true },
    });

    for (const shop of sellerShops) {
      const productTitle =
        (shopGrouped[shop.id]?.[0]?.title as string) || "new item";

      /*
        All three consoles route an order detail page at `/order/<id>`, so one
        relative path works in every app. It replaces `https://eshop.com/...`,
        which pointed at a domain that does not exist — and pointed at the
        session id, where all three routes expect an order id.
      */
      const orderLink = `/order/${orderIdByShop[shop.id]}`;

      await prisma.notifications.createMany({
        data: [
          {
            title: "New Order Received",
            message: `A customer just ordered ${productTitle} from your shop.`,
            creatorId: userId,
            receiverId: shop.sellerId,
            redirect_link: orderLink,
          },
          {
            title: "Platform Order Alert",
            message: `A new order was placed by ${name}.`,
            creatorId: userId,
            receiverId: "admin",
            redirect_link: orderLink,
          },
          /*
            The buyer was the one party the order path never told in-app — they
            only got the confirmation email above. One row per order rather than
            per cart, so each links to the order it is actually about.
          */
          {
            title: "Order confirmed",
            message: `Your order from ${shop.name} is confirmed. We'll let you know as it ships.`,
            creatorId: userId,
            receiverId: userId,
            redirect_link: orderLink,
          },
        ],
      });

      /*
        The seller's low-stock threshold was stored and read back by the
        settings form and consulted by nothing — no alert existed at any point
        in the order path. This is that alert.

        It is deliberately one notification per order rather than one per
        product: a cart that empties five lines at once is one restock trip,
        not five things to read.
      */
      const lowStock = lowStockByShop[shop.id] ?? [];
      const channels = {
        ...DEFAULT_NOTIFICATION_CHANNELS,
        ...((settingsByShop.get(shop.id)?.notifications as
          | Record<string, boolean>
          | null) ?? {}),
      };

      if (lowStock.length > 0 && channels.web) {
        const [first] = lowStock;
        const others = lowStock.length - 1;

        await prisma.notifications.create({
          data: {
            title: "Low stock",
            message:
              others > 0
                ? `${first.title} is down to ${first.stock} left, along with ${others} other ${others === 1 ? "product" : "products"}.`
                : `${first.title} is down to ${first.stock} left.`,
            creatorId: userId,
            receiverId: shop.sellerId,
            redirect_link: "/dashboard/all-products",
          },
        });
      }
    }

    await redis.del(sessionKey);

    logAsync({
      type: "success",
      message: `Order placed (session ${sessionId}) by user ${userId} across ${sellerShops.length} shop(s) in ${isWebhook ? "webhook" : "manual"} mode`,
    });

    return res.status(200).json({
      received: true,
      message: `✅ Order placed successfully in ${
        isWebhook ? "webhook" : "manual"
      } mode!`,
    });
  } catch (err) {
    console.error("❌ Error in createOrder:", err);
    // A failure here can mean the customer was charged but no order exists,
    // so this is escalated above the generic error-middleware entry.
    logAsync({ type: "error", message: `Order creation FAILED: ${(err as Error)?.message}` });
    return next(err);
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any)?.user?.id;

    if (!userId) {
      return next(
        new ValidationError("Invalid request data", "User ID missing in token context")
      );
    }

    const orders = await prisma.orders.findMany({
      where: { userId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    return next(err);
  }
};

export const getSellerOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shop = await prisma.shops.findUnique({
      where: { sellerId: (req as any)?.seller?.id },
    });

    // Without a shop there is nothing to scope the query to, and passing
    // `shopId: undefined` would make Prisma drop the filter and return every
    // order in the database.
    if (!shop) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orders = await prisma.orders.findMany({
      where: { shopId: shop.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    return next(err);
  }
};

export const getOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.orderId;
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return next(new NotFoundError("Order not found with the id!"));

    // Any signed-in user could otherwise read any order by guessing its id.
    // Answer 404 rather than 403 so the endpoint doesn't confirm the id exists.
    if (order.userId !== (req as any)?.user?.id) {
      return next(new NotFoundError("Order not found with the id!"));
    }

    const shippingAddress = order.shippingAddressId
      ? await prisma.address.findUnique({
          where: { id: order?.shippingAddressId },
        })
      : null;

    const coupon = order.couponCode
      ? await prisma.discount_codes.findUnique({
          where: { discountCode: order?.couponCode },
        })
      : null;

    const productIds = order.items.map((item) => item.productId);
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items: any = order.items.map((item) => ({
      ...item,
      selectedOptions: item.selectedOptions,
      product: productMap.get(item.productId) || null,
    }));

    res.status(200).json({
      success: true,
      order: {
        ...order,
        items,
        shippingAddress,
        couponCode: coupon,
      },
    });
  } catch (err) {
    return next(err);
  }
};


/*
  The delivery states a seller may set, each paired with what the buyer is told
  when the order reaches it. Holding the copy against the vocabulary means a new
  state cannot be added without deciding what it announces — and `allowedStatuses`
  is derived from it below, so the two can never drift apart.
*/
const DELIVERY_NOTICE: Record<string, { title: string; message: string }> = {
  Ordered: {
    title: "Order placed",
    message: "Your order has been placed and is with the seller.",
  },
  Packed: {
    title: "Order packed",
    message: "Your order has been packed and is ready to ship.",
  },
  Shipped: {
    title: "Order shipped",
    message: "Your order is on its way.",
  },
  "Out for Delivery": {
    title: "Out for delivery",
    message: "Your order is out for delivery and should arrive today.",
  },
  Delivered: {
    title: "Order delivered",
    message: "Your order has been delivered.",
  },
};

export const updateDeliveryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    if (!orderId || !deliveryStatus)
      return res
        .status(400)
        .json({ error: "Missin order ID or delivery status!" });

    const allowedStatuses = Object.keys(DELIVERY_NOTICE);

    if (!allowedStatuses.includes(deliveryStatus))
      return next(new ValidationError("Invalid request data", {
        deliveryStatus: "Invalid delivery status",
      }));

    const existingOrder = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) return next(new NotFoundError("Order not found!"));

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        deliveryStatus,
        updatedAt: new Date(),
      },
    });
    logAsync({ type: "info", message: `Order ${orderId} delivery status -> ${deliveryStatus}` });

    /*
      Only on an actual transition. The seller sets this from a dropdown, so
      re-saving the status it already had is easy to do by accident and must not
      produce a second "your order has shipped".
    */
    if (existingOrder.deliveryStatus !== deliveryStatus) {
      try {
        await prisma.notifications.create({
          data: {
            ...DELIVERY_NOTICE[deliveryStatus],
            creatorId: (req as any).seller.id,
            receiverId: existingOrder.userId,
            redirect_link: `/order/${orderId}`,
          },
        });
      } catch (err: any) {
        // The status change is already committed. Failing to announce it should
        // not turn the seller's successful update into a 500.
        logAsync({
          type: "error",
          message: `Order ${orderId} status saved but buyer notification failed: ${err?.message}`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Delivery status updated successfully!",
      order: updatedOrder,
    });
  } catch (err) {
    return next(err);
  }
};

export const verifyCouponCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { couponCode, cart } = req.body;
    if (!couponCode || !cart || cart.length === 0)
      return next(new ValidationError("Invalid request data", {
        couponCode: "Coupon code and cart are required!",
      }));

    const discount = await prisma.discount_codes.findUnique({
      where: { discountCode: couponCode },
    });
    if (!discount) return next(new ValidationError("Invalid request data", {
      couponCode: "Coupon code isn't valid!",
    }));

    const matchingProduct = cart.find((item: any) =>
      item?.discount_codes?.some((d: any) => d === discount.id)
    );

    if (!matchingProduct)
      return res.status(200).json({
        valid: false,
        discount: 0,
        discountAmount: 0,
        message: "No matching product found in cart for this coupon",
      });

    let discountAmount = 0;
    const price = matchingProduct.sale_price * matchingProduct.quantity;

    if (discount.discountType === "percentage")
      discountAmount = (price * discount.discountValue) / 100;
    else if (discount.discountType === "flat")
      discountAmount = discount.discountValue;

    discountAmount = Math.min(discountAmount, price);

    res.status(200).json({
      valid: true,
      discount: discount.discountValue,
      discountAmount: discountAmount.toFixed(2),
      discountProductId: matchingProduct.id,
      discountType: discount.discountType,
      message: "Discount applied to 1 eligible product",
    });
  } catch (err) {
    return next(err);
  }
};

export const getAdminOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await prisma.orders.findMany({
      include: { user: true, shop: true },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    return next(err);
  }
};