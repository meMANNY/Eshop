import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/*
  Which shop gets the demo data. This seeds into a REAL seller account rather
  than inventing a synthetic one, so the data shows up in the dashboard you
  actually log into. Override with SEED_SELLER_EMAIL to point it elsewhere.
*/
const SELLER_EMAIL =
  process.env.SEED_SELLER_EMAIL ?? "amanttripathi02@gmail.com";

// Unsplash allows hotlinking, and both user-ui and seller-ui already whitelist
// the host in `next.config.js`.
const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&q=80",
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80",
];

const CATALOGUE = [
  { title: "Wireless Headphones", category: "Electronics", subCategory: "Audio", sale_price: 79.99, regular_price: 129.99, stock: 25 },
  { title: "Smart Watch", category: "Electronics", subCategory: "Wearables", sale_price: 149.0, regular_price: 199.0, stock: 8 },
  { title: "Mechanical Keyboard", category: "Electronics", subCategory: "Accessories", sale_price: 59.5, regular_price: 89.0, stock: 40 },
  { title: "Desk Lamp", category: "Home", subCategory: "Lighting", sale_price: 24.99, regular_price: 34.99, stock: 3 },
  { title: "Bluetooth Speaker", category: "Electronics", subCategory: "Audio", sale_price: 45.0, regular_price: 69.0, stock: 18 },
  { title: "Laptop Stand", category: "Electronics", subCategory: "Accessories", sale_price: 32.0, regular_price: 48.0, stock: 0 },
  { title: "Cotton Throw Blanket", category: "Home", subCategory: "Textiles", sale_price: 38.5, regular_price: 55.0, stock: 12 },
  { title: "Ceramic Mug Set", category: "Home", subCategory: "Kitchen", sale_price: 21.0, regular_price: 28.0, stock: 60 },
];

// The full delivery vocabulary the order service accepts, weighted so most
// seeded orders are historical and only a few are still moving.
const DELIVERY_SPREAD = [
  "Delivered", "Delivered", "Delivered", "Delivered", "Delivered",
  "Delivered", "Delivered", "Out for Delivery", "Shipped", "Shipped",
  "Packed", "Packed", "Ordered", "Ordered",
];

/*
  A fixed-seed PRNG, so re-running the script produces the same catalogue and
  the same order history instead of a new random set every time. That is what
  lets the cleanup below be an honest "replace what I made last time".
*/
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

async function main() {
  /*
    Two independent streams rather than one. Products are only generated on the
    first run, so a single shared stream would be at a different position by the
    time the orders were built, and a re-run would produce a different order
    history than the run before it.
  */
  const catalogueRandom = rng(20260819);
  const random = rng(770118);

  const seller = await prisma.sellers.findUnique({
    where: { email: SELLER_EMAIL },
    include: { shop: true },
  });

  if (!seller) {
    const known = await prisma.sellers.findMany({ select: { email: true } });
    throw new Error(
      `No seller with email "${SELLER_EMAIL}". Known sellers:\n` +
        known.map((s) => `  - ${s.email}`).join("\n") +
        `\nSet SEED_SELLER_EMAIL to one of these.`
    );
  }
  if (!seller.shop) {
    throw new Error(`Seller "${SELLER_EMAIL}" has no shop yet — create one first.`);
  }

  const shop = seller.shop;
  // Scopes every row this script writes, so a re-run replaces its own data and
  // never touches products or orders you created by hand.
  const TAG = shop.id.slice(-6);
  const SESSION_PREFIX = `seed-${TAG}-`;

  const buyers = await prisma.users.findMany({ select: { id: true, name: true } });
  if (buyers.length === 0) {
    throw new Error("No users in the database — orders and reviews need a buyer.");
  }

  console.log(`Seeding shop "${shop.name}" (${shop.id}) for ${SELLER_EMAIL}\n`);

  /* ------------------------------------------------------- clean previous -- */

  const previous = await prisma.orders.findMany({
    where: { sessionId: { startsWith: SESSION_PREFIX } },
    select: { id: true },
  });

  if (previous.length > 0) {
    const ids = previous.map((o) => o.id);
    // Notifications first, then items, then the orders themselves — the
    // relations are required, so the children have to go before the parents.
    await prisma.notifications.deleteMany({
      where: { redirect_link: { in: ids.map((id) => `/order/${id}`) } },
    });
    await prisma.orderItems.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orders.deleteMany({ where: { id: { in: ids } } });
    console.log(`  cleaned ${ids.length} order(s) from a previous run`);
  }

  /* ------------------------------------------------------------- products -- */

  const productIds: string[] = [];
  let imagesAttached = 0;
  let imagesBlocked = 0;

  for (let i = 0; i < CATALOGUE.length; i++) {
    const p = CATALOGUE[i];
    // `slug` is globally unique, so it carries the shop tag to stay clear of
    // both other shops and anything you created yourself.
    const slug = `${p.title.toLowerCase().replace(/\s+/g, "-")}-${TAG}`;

    const existing = await prisma.products.findUnique({
      where: { slug },
      select: { id: true },
    });

    const created = existing ?? (await prisma.products.create({
      data: {
        title: p.title,
        slug,
        category: p.category,
        subCategory: p.subCategory,
        short_description: `${p.title} — great value, seeded for demo.`,
        detailed_description: `Full detailed description for ${p.title}. Seeded sample content for local development.`,
        tags: [p.category.toLowerCase(), p.subCategory.toLowerCase()],
        stock: p.stock,
        sale_price: p.sale_price,
        regular_price: p.regular_price,
        totalSales: 0,
        ratings: Number((3.6 + catalogueRandom() * 1.4).toFixed(1)),
        brand: "Acme",
        colors: [],
        sizes: [],
        discount_codes: [],
        custom_specification: {},
        custom_properties: {},
        cashOnDelivery: "yes",
        shopId: shop.id,
      },
      select: { id: true },
    }));

    productIds.push(created.id);

    /*
      Attached outside the create/skip branch above, so a re-run backfills
      products that already exist — which is what a run made before the images
      unique-index fix leaves behind.

      Still a separate create rather than a nested one, and still tolerant of
      P2002: if those non-sparse unique indexes are ever reintroduced, a failed
      image should not take the whole product down with it.
    */
    const hasImage = await prisma.images.findFirst({
      where: { productId: created.id },
      select: { id: true },
    });

    if (!hasImage) {
      try {
        await prisma.images.create({
          data: {
            file_id: `seed-${TAG}-${i}`,
            url: SAMPLE_IMAGES[i % SAMPLE_IMAGES.length],
            productId: created.id,
          },
        });
        imagesAttached++;
      } catch (err: any) {
        if (err?.code !== "P2002") throw err;
        imagesBlocked++;
      }
    }
  }

  console.log(
    `  ${productIds.length} product(s) present` +
      ` — ${imagesAttached} image(s) attached` +
      (imagesBlocked > 0
        ? `, ${imagesBlocked} blocked by the images unique-index bug`
        : "")
  );

  /* --------------------------------------------------------------- orders -- */

  const priceOf = new Map(
    (
      await prisma.products.findMany({
        where: { id: { in: productIds } },
        select: { id: true, sale_price: true, title: true },
      })
    ).map((p) => [p.id, p])
  );

  const soldPerProduct = new Map<string, number>();
  const orderIds: { id: string; status: string; title: string }[] = [];

  for (let i = 0; i < DELIVERY_SPREAD.length; i++) {
    const deliveryStatus = DELIVERY_SPREAD[i];
    const buyer = buyers[i % buyers.length];

    // One to three distinct products per order.
    const itemCount = 1 + Math.floor(random() * 3);
    const chosen = new Set<string>();
    while (chosen.size < Math.min(itemCount, productIds.length)) {
      chosen.add(productIds[Math.floor(random() * productIds.length)]);
    }

    const items = [...chosen].map((productId) => {
      const quantity = 1 + Math.floor(random() * 3);
      soldPerProduct.set(
        productId,
        (soldPerProduct.get(productId) ?? 0) + quantity
      );
      return {
        productId,
        quantity,
        price: priceOf.get(productId)!.sale_price,
      };
    });

    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    // Spread across roughly two months so the sales chart has a shape rather
    // than a single spike.
    const placedAt = daysAgo(Math.floor(i * 4 + random() * 3));

    const order = await prisma.orders.create({
      data: {
        userId: buyer.id,
        shopId: shop.id,
        total: Number(total.toFixed(2)),
        sessionId: `${SESSION_PREFIX}${i}`,
        status: "Paid",
        deliveryStatus,
        createdAt: placedAt,
        items: { create: items },
      },
      select: { id: true },
    });

    orderIds.push({
      id: order.id,
      status: deliveryStatus,
      title: priceOf.get(items[0].productId)!.title,
    });
  }

  console.log(`  ${orderIds.length} order(s) created`);

  /* ------------------------------------------------- sales and analytics -- */

  for (const [productId, sold] of soldPerProduct) {
    await prisma.products.update({
      where: { id: productId },
      data: { totalSales: sold },
    });

    // `productAnalytics.productId` is @unique — one row per product.
    await prisma.productAnalytics.upsert({
      where: { productId },
      create: {
        productId,
        shopId: shop.id,
        views: 40 + Math.floor(random() * 400),
        cartAdds: sold + Math.floor(random() * 20),
        wishlistAdds: Math.floor(random() * 30),
        purchases: sold,
        lastViewedAt: daysAgo(Math.floor(random() * 5)),
      },
      update: {
        purchases: sold,
        lastViewedAt: daysAgo(Math.floor(random() * 5)),
      },
    });
  }

  console.log(`  analytics written for ${soldPerProduct.size} product(s)`);

  /* -------------------------------------------------------------- reviews -- */

  for (const buyer of buyers) {
    // No unique constraint on (userId, shopId), so guard by lookup rather than
    // upsert — otherwise every run stacks another review from the same person.
    const already = await prisma.shopReviews.findFirst({
      where: { userId: buyer.id, shopId: shop.id },
      select: { id: true },
    });
    if (already) continue;

    await prisma.shopReviews.create({
      data: {
        userId: buyer.id,
        shopId: shop.id,
        rating: 4 + Math.round(random()),
      },
    });
  }

  // The shop carries its own rating summary; leaving it at 0 while reviews
  // exist is what makes a seeded shop show an empty star row.
  const reviews = await prisma.shopReviews.findMany({
    where: { shopId: shop.id },
    select: { rating: true },
  });

  if (reviews.length > 0) {
    const mean = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await prisma.shops.update({
      where: { id: shop.id },
      data: {
        ratings: Number(mean.toFixed(2)),
        totalRating: reviews.length,
      },
    });
  }

  console.log(`  ${reviews.length} shop review(s)`);

  /* -------------------------------------------------------- notifications -- */

  /*
    Mirrors what order-service now emits on checkout and on a status change, so
    the buyer's Notifications tab and the seller's page both have something to
    show without having to walk a real order through Stripe.
  */
  const notices: any[] = [];

  for (const order of orderIds.slice(0, 6)) {
    const buyerOrder = await prisma.orders.findUnique({
      where: { id: order.id },
      select: { userId: true },
    });
    if (!buyerOrder) continue;

    notices.push({
      title: "Order confirmed",
      message: `Your order from ${shop.name} is confirmed. We'll let you know as it ships.`,
      creatorId: buyerOrder.userId,
      receiverId: buyerOrder.userId,
      redirect_link: `/order/${order.id}`,
    });

    if (order.status === "Delivered") {
      notices.push({
        title: "Order delivered",
        message: "Your order has been delivered.",
        creatorId: seller.id,
        receiverId: buyerOrder.userId,
        redirect_link: `/order/${order.id}`,
      });
    }

    notices.push({
      title: "New Order Received",
      message: `A customer just ordered ${order.title} from your shop.`,
      creatorId: buyerOrder.userId,
      receiverId: seller.id,
      redirect_link: `/order/${order.id}`,
    });
  }

  await prisma.notifications.createMany({ data: notices });
  console.log(`  ${notices.length} notification(s)`);

  /* ---------------------------------------------------------------- done -- */

  const revenue = await prisma.orders.aggregate({
    where: { shopId: shop.id },
    _sum: { total: true },
  });

  console.log(
    `\n✅ Seed complete.\n` +
      `   shop      ${shop.name}\n` +
      `   products  ${await prisma.products.count({ where: { shopId: shop.id } })}\n` +
      `   orders    ${await prisma.orders.count({ where: { shopId: shop.id } })}\n` +
      `   revenue   $${(revenue._sum.total ?? 0).toFixed(2)}\n`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
