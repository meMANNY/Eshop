import prisma from "../../../../packages/libs/primsa";
import { ValidationError } from "../../../../packages/error-handler";

/*
  Everything about a checkout used to be taken from the request body: the line
  prices, the shop each item belonged to, the coupon discount, and — at
  `create-payment-intent` — the amount charged to the card. Authentication only
  proves who is buying, never what the price is, so a logged-in buyer could post
  `amount: 0.50` and check out anything for fifty cents.

  This module is the single place that decides what a cart actually costs. Every
  figure below is read from the database or derived from figures that were; the
  only things taken from the client are which product, how many, and which
  variant was picked. "Trusted" in the type names means exactly that, so it is
  visible at the call site whether Stripe is being charged from a number the
  server owns.
*/

export type TrustedLineItem = {
  id: string;
  title: string;
  quantity: number;
  sale_price: number;
  shopId: string;
  selectedOptions: Record<string, unknown>;
  discount_codes: string[];
};

export type TrustedCoupon = {
  code: string;
  discountAmount: number;
  discountPercent: number;
  discountProductId: string;
  discountType: string;
};

export type TrustedCheckout = {
  items: TrustedLineItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  totalCents: number;
  coupon: TrustedCoupon | null;
};

// Mongo ObjectIDs are 24 hex characters. Anything else makes Prisma throw P2023,
// which surfaces as an unhandled 500 rather than the 400 a bad id deserves.
const isObjectId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

const toQuantity = (value: unknown): number => {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) return 0;
  return quantity;
};

// Money is rounded to cents at every step so a float sum cannot drift a fraction
// of a penny away from the integer amount Stripe is actually charged.
const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export const buildTrustedCheckout = async (
  cart: unknown,
  couponCode?: string | null
): Promise<TrustedCheckout> => {
  if (!Array.isArray(cart) || cart.length === 0)
    throw new ValidationError("Invalid request data", "Cart is empty or invalid");

  const requested = cart.map((item: any) => {
    if (!isObjectId(item?.id))
      throw new ValidationError("Invalid request data", "Cart contains an invalid product id");

    const quantity = toQuantity(item?.quantity);
    if (!quantity)
      throw new ValidationError(
        "Invalid request data",
        "Cart quantities must be whole numbers between 1 and 1000"
      );

    return {
      id: item.id as string,
      quantity,
      selectedOptions: (item?.selectedOptions ?? {}) as Record<string, unknown>,
    };
  });

  const products = await prisma.products.findMany({
    where: { id: { in: requested.map((item) => item.id) } },
    select: {
      id: true,
      title: true,
      sale_price: true,
      shopId: true,
      isDeleted: true,
      discount_codes: true,
    },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const items: TrustedLineItem[] = requested.map((item) => {
    const product = productById.get(item.id);

    // A product that vanished or was soft-deleted between adding to cart and
    // checking out must not be silently charged for.
    if (!product || product.isDeleted)
      throw new ValidationError(
        "Invalid request data",
        "A product in your cart is no longer available"
      );

    return {
      id: product.id,
      title: product.title,
      quantity: item.quantity,
      // Price and shop both come from the row, never from the request. The shop
      // matters as much as the price: it decides which seller gets paid.
      sale_price: product.sale_price,
      shopId: product.shopId!,
      selectedOptions: item.selectedOptions,
      discount_codes: product.discount_codes ?? [],
    };
  });

  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.sale_price * item.quantity, 0)
  );

  const { coupon, discountAmount } = await resolveCoupon(items, couponCode);
  const total = roundMoney(Math.max(0, subtotal - discountAmount));

  return {
    items,
    subtotal,
    discountAmount,
    total,
    totalCents: Math.round(total * 100),
    coupon,
  };
};

/*
  The coupon was previously taken from the body as a ready-made
  `{ discountAmount }`, so a client could name its own discount. Here the code is
  the only input; the amount is recomputed from the discount row and the trusted
  line price, then clamped to that line's value so a flat coupon worth more than
  the product cannot turn an order negative.
*/
const resolveCoupon = async (
  items: TrustedLineItem[],
  couponCode?: string | null
): Promise<{ coupon: TrustedCoupon | null; discountAmount: number }> => {
  const code = typeof couponCode === "string" ? couponCode.trim() : "";
  if (!code) return { coupon: null, discountAmount: 0 };

  const discount = await prisma.discount_codes.findUnique({
    where: { discountCode: code },
  });
  // An unknown or inapplicable code is not an error — the order proceeds at full
  // price, exactly as if none had been entered.
  if (!discount) return { coupon: null, discountAmount: 0 };

  const matching = items.find((item) => item.discount_codes.includes(discount.id));
  if (!matching) return { coupon: null, discountAmount: 0 };

  const linePrice = roundMoney(matching.sale_price * matching.quantity);
  const raw =
    discount.discountType === "percentage"
      ? (linePrice * discount.discountValue) / 100
      : discount.discountType === "flat"
      ? discount.discountValue
      : 0;

  const discountAmount = roundMoney(Math.min(Math.max(0, raw), linePrice));

  return {
    coupon: {
      code,
      discountAmount,
      discountPercent:
        discount.discountType === "percentage" ? discount.discountValue : 0,
      discountProductId: matching.id,
      discountType: discount.discountType,
    },
    discountAmount,
  };
};
