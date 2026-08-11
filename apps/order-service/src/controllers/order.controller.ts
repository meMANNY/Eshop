import {NextFunction, Request, Response} from "express";
import Stripe from "stripe";
import redis from "../../../../packages/libs/redis";
import prisma from "../../../../packages/libs/primsa";
import { NotFoundError, ValidationError } from "../../../../packages/error-handler";
import { Prisma } from "@prisma/client";
import { sendEmail } from "../utils/send-email/index";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia'
});


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
      600,
      JSON.stringify(sessionData)
    );

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

      await prisma.orders.create({
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
      for (const item of orderItems) {
        const { id: productId, quantity } = item;

        await prisma.products.update({
          where: { id: productId },
          data: {
            stock: { decrement: quantity },
            totalSales: { increment: quantity },
          },
        });

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
      await prisma.notifications.createMany({
        data: [
          {
            title: "New Order Received",
            message: `A customer just ordered ${productTitle} from your shop.`,
            creatorId: userId,
            receiverId: shop.sellerId,
            redirect_link: `https://eshop.com/order/${sessionId}`,
          },
          {
            title: "Platform Order Alert",
            message: `A new order was placed by ${name}.`,
            creatorId: userId,
            receiverId: "admin",
            redirect_link: `https://eshop.com/order/${sessionId}`,
          },
        ],
      });
    }

    await redis.del(sessionKey);

    return res.status(200).json({
      received: true,
      message: `✅ Order placed successfully in ${
        isWebhook ? "webhook" : "manual"
      } mode!`,
    });
  } catch (err) {
    console.error("❌ Error in createOrder:", err);
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

    const allowedStatuses = [
      "Ordered",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];

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
    return res.status(200).json({
      success: true,
      message: "Delivery status updated successfully!",
      order: updatedOrder,
    });
  } catch (err) {
    return next(err);
  }
};

