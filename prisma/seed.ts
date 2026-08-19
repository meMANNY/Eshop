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

/*
  How many synthetic shoppers to generate. Item-to-item collaborative filtering
  has nothing to work with below a few dozen buyers: with two, every surviving
  pair scores exactly 1.0, because the only pairs that clear the minimum
  co-occurrence are ones both buyers bought — so the cosine is forced to
  2/sqrt(2*2). Around 150+ the scores start to spread into a real range.
*/
const BUYER_COUNT = Number(process.env.SEED_BUYERS ?? 200);

/** Synthetic accounts are addressable only here. `.invalid` can never resolve. */
const BUYER_EMAIL_PREFIX = "seed.buyer.";

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

type CatalogueItem = {
  title: string;
  persona: string;
  category: string;
  subCategory: string;
  brand: string;
  tags: string[];
  sale_price: number;
  regular_price: number;
  stock: number;
};

/*
  The catalogue is grouped by `persona` — the kind of shopper who buys it. That
  grouping is what makes the generated order history mean anything: a random
  basket generator produces co-occurrence that is pure chance, and the recommender
  would faithfully learn noise. Buyers here draw mostly from one persona, so the
  index has real structure to recover, and "customers also bought" comes back with
  a speaker next to headphones rather than a mug.

  Tags and brands are populated properly because content similarity is scored on
  sub-category, category, brand and tags — sparse tags mean weak neighbours.
*/
const CATALOGUE: CatalogueItem[] = [
  // ---------------------------------------------------------------- desk --
  { title: "Mechanical Keyboard", persona: "desk", category: "Electronics", subCategory: "Accessories", brand: "Keychron", tags: ["keyboard", "mechanical", "typing", "desk"], sale_price: 59.5, regular_price: 89.0, stock: 40 },
  { title: "Laptop Stand", persona: "desk", category: "Electronics", subCategory: "Accessories", brand: "Nulaxy", tags: ["laptop", "ergonomic", "stand", "desk"], sale_price: 32.0, regular_price: 48.0, stock: 14 },
  { title: "Wireless Mouse", persona: "desk", category: "Electronics", subCategory: "Accessories", brand: "Logitech", tags: ["mouse", "wireless", "ergonomic", "desk"], sale_price: 27.0, regular_price: 39.0, stock: 55 },
  { title: "Monitor Arm", persona: "desk", category: "Electronics", subCategory: "Accessories", brand: "Ergotron", tags: ["monitor", "ergonomic", "mount", "desk"], sale_price: 119.0, regular_price: 159.0, stock: 9 },
  { title: "USB-C Hub", persona: "desk", category: "Electronics", subCategory: "Accessories", brand: "Anker", tags: ["usb", "hub", "adapter", "desk"], sale_price: 44.0, regular_price: 59.0, stock: 31 },
  { title: "Desk Mat", persona: "desk", category: "Electronics", subCategory: "Accessories", brand: "Grovemade", tags: ["deskmat", "felt", "desk", "workspace"], sale_price: 38.0, regular_price: 52.0, stock: 22 },
  { title: "Webcam 1080p", persona: "desk", category: "Electronics", subCategory: "Accessories", brand: "Logitech", tags: ["webcam", "video", "meetings", "desk"], sale_price: 64.0, regular_price: 89.0, stock: 17 },
  { title: "Desk Lamp", persona: "desk", category: "Home", subCategory: "Lighting", brand: "BenQ", tags: ["lamp", "lighting", "desk", "workspace"], sale_price: 24.99, regular_price: 34.99, stock: 3 },

  // --------------------------------------------------------------- audio --
  { title: "Wireless Headphones", persona: "audio", category: "Electronics", subCategory: "Audio", brand: "Sony", tags: ["headphones", "wireless", "noise-cancelling", "audio"], sale_price: 79.99, regular_price: 129.99, stock: 25 },
  { title: "Bluetooth Speaker", persona: "audio", category: "Electronics", subCategory: "Audio", brand: "JBL", tags: ["speaker", "bluetooth", "portable", "audio"], sale_price: 45.0, regular_price: 69.0, stock: 18 },
  { title: "True Wireless Earbuds", persona: "audio", category: "Electronics", subCategory: "Audio", brand: "Sony", tags: ["earbuds", "wireless", "portable", "audio"], sale_price: 89.0, regular_price: 119.0, stock: 27 },
  { title: "Compact Soundbar", persona: "audio", category: "Electronics", subCategory: "Audio", brand: "JBL", tags: ["soundbar", "home-cinema", "speaker", "audio"], sale_price: 149.0, regular_price: 199.0, stock: 7 },
  { title: "Headphone Stand", persona: "audio", category: "Electronics", subCategory: "Audio", brand: "Grovemade", tags: ["stand", "headphones", "desk", "audio"], sale_price: 29.0, regular_price: 39.0, stock: 33 },
  { title: "Portable DAC", persona: "audio", category: "Electronics", subCategory: "Audio", brand: "FiiO", tags: ["dac", "amplifier", "hi-fi", "audio"], sale_price: 99.0, regular_price: 129.0, stock: 11 },
  { title: "Studio Monitor Pair", persona: "audio", category: "Electronics", subCategory: "Audio", brand: "Yamaha", tags: ["monitors", "studio", "speaker", "audio"], sale_price: 219.0, regular_price: 279.0, stock: 5 },

  // ------------------------------------------------------------- kitchen --
  { title: "Ceramic Mug Set", persona: "kitchen", category: "Home", subCategory: "Kitchen", brand: "Denby", tags: ["mug", "ceramic", "coffee", "kitchen"], sale_price: 21.0, regular_price: 28.0, stock: 60 },
  { title: "French Press", persona: "kitchen", category: "Home", subCategory: "Kitchen", brand: "Bodum", tags: ["coffee", "brewing", "press", "kitchen"], sale_price: 26.0, regular_price: 35.0, stock: 41 },
  { title: "Electric Kettle", persona: "kitchen", category: "Home", subCategory: "Kitchen", brand: "Fellow", tags: ["kettle", "coffee", "boiling", "kitchen"], sale_price: 89.0, regular_price: 115.0, stock: 16 },
  { title: "Pour-Over Dripper", persona: "kitchen", category: "Home", subCategory: "Kitchen", brand: "Hario", tags: ["coffee", "brewing", "pourover", "kitchen"], sale_price: 18.0, regular_price: 24.0, stock: 48 },
  { title: "Chopping Board", persona: "kitchen", category: "Home", subCategory: "Kitchen", brand: "Boos", tags: ["board", "wood", "prep", "kitchen"], sale_price: 42.0, regular_price: 58.0, stock: 20 },
  { title: "Knife Block Set", persona: "kitchen", category: "Home", subCategory: "Kitchen", brand: "Wusthof", tags: ["knives", "prep", "steel", "kitchen"], sale_price: 165.0, regular_price: 219.0, stock: 6 },
  { title: "Glass Storage Jars", persona: "kitchen", category: "Home", subCategory: "Kitchen", brand: "Kilner", tags: ["storage", "glass", "pantry", "kitchen"], sale_price: 23.0, regular_price: 31.0, stock: 52 },

  // ------------------------------------------------------------- bedroom --
  { title: "Cotton Throw Blanket", persona: "bedroom", category: "Home", subCategory: "Textiles", brand: "Foxford", tags: ["blanket", "cotton", "throw", "bedroom"], sale_price: 38.5, regular_price: 55.0, stock: 12 },
  { title: "Linen Cushion Cover", persona: "bedroom", category: "Home", subCategory: "Textiles", brand: "Foxford", tags: ["cushion", "linen", "cover", "bedroom"], sale_price: 19.0, regular_price: 27.0, stock: 44 },
  { title: "Percale Sheet Set", persona: "bedroom", category: "Home", subCategory: "Textiles", brand: "Brooklinen", tags: ["sheets", "cotton", "bedding", "bedroom"], sale_price: 112.0, regular_price: 145.0, stock: 13 },
  { title: "Wool Area Rug", persona: "bedroom", category: "Home", subCategory: "Textiles", brand: "Ruggable", tags: ["rug", "wool", "floor", "bedroom"], sale_price: 179.0, regular_price: 229.0, stock: 4 },
  { title: "Bedside Lamp", persona: "bedroom", category: "Home", subCategory: "Lighting", brand: "Muuto", tags: ["lamp", "lighting", "bedside", "bedroom"], sale_price: 54.0, regular_price: 72.0, stock: 19 },
  { title: "Blackout Curtains", persona: "bedroom", category: "Home", subCategory: "Textiles", brand: "Ikea", tags: ["curtains", "blackout", "window", "bedroom"], sale_price: 47.0, regular_price: 63.0, stock: 26 },

  // ------------------------------------------------------------- fitness --
  { title: "Yoga Mat", persona: "fitness", category: "Fitness", subCategory: "Training", brand: "Manduka", tags: ["yoga", "mat", "training", "fitness"], sale_price: 68.0, regular_price: 89.0, stock: 24 },
  { title: "Adjustable Dumbbells", persona: "fitness", category: "Fitness", subCategory: "Training", brand: "Bowflex", tags: ["dumbbells", "weights", "strength", "fitness"], sale_price: 249.0, regular_price: 329.0, stock: 5 },
  { title: "Resistance Band Set", persona: "fitness", category: "Fitness", subCategory: "Training", brand: "TheraBand", tags: ["bands", "resistance", "mobility", "fitness"], sale_price: 24.0, regular_price: 33.0, stock: 61 },
  { title: "Insulated Water Bottle", persona: "fitness", category: "Fitness", subCategory: "Training", brand: "Hydro Flask", tags: ["bottle", "hydration", "insulated", "fitness"], sale_price: 34.0, regular_price: 45.0, stock: 58 },
  { title: "Foam Roller", persona: "fitness", category: "Fitness", subCategory: "Training", brand: "TriggerPoint", tags: ["roller", "recovery", "mobility", "fitness"], sale_price: 31.0, regular_price: 42.0, stock: 29 },
  { title: "Smart Watch", persona: "fitness", category: "Electronics", subCategory: "Wearables", brand: "Garmin", tags: ["watch", "tracker", "wearable", "fitness"], sale_price: 149.0, regular_price: 199.0, stock: 8 },

  // --------------------------------------------------------- photography --
  { title: "Camera Sling Bag", persona: "photo", category: "Electronics", subCategory: "Photography", brand: "Peak Design", tags: ["bag", "camera", "carry", "photography"], sale_price: 89.0, regular_price: 119.0, stock: 15 },
  { title: "Travel Tripod", persona: "photo", category: "Electronics", subCategory: "Photography", brand: "Peak Design", tags: ["tripod", "camera", "travel", "photography"], sale_price: 179.0, regular_price: 239.0, stock: 7 },
  { title: "SD Card 128GB", persona: "photo", category: "Electronics", subCategory: "Photography", brand: "SanDisk", tags: ["storage", "sdcard", "camera", "photography"], sale_price: 29.0, regular_price: 39.0, stock: 73 },
  { title: "Lens Cleaning Kit", persona: "photo", category: "Electronics", subCategory: "Photography", brand: "Zeiss", tags: ["cleaning", "lens", "care", "photography"], sale_price: 16.0, regular_price: 22.0, stock: 66 },
  { title: "LED Panel Light", persona: "photo", category: "Electronics", subCategory: "Photography", brand: "Aputure", tags: ["light", "led", "video", "photography"], sale_price: 129.0, regular_price: 169.0, stock: 10 },
  { title: "Camera Strap", persona: "photo", category: "Electronics", subCategory: "Photography", brand: "Peak Design", tags: ["strap", "camera", "carry", "photography"], sale_price: 54.0, regular_price: 69.0, stock: 21 },
];

/** How often a buyer strays outside their persona. Some crossover is realistic. */
const CROSSOVER_RATE = 0.2;

// The full delivery vocabulary the order service accepts, weighted so most
// seeded orders are historical and only a few are still moving.
const DELIVERY_SPREAD = [
  "Delivered", "Delivered", "Delivered", "Delivered", "Delivered",
  "Delivered", "Delivered", "Out for Delivery", "Shipped", "Shipped",
  "Packed", "Packed", "Ordered", "Ordered",
];

/*
  A fixed-seed PRNG, so re-running the script produces the same catalogue and the
  same order history instead of a new random set every time. That is what lets
  the cleanup below be an honest "replace what I made last time".
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

/** Orders are one round trip each; sending them in waves keeps the run short. */
async function inBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    out.push(...(await Promise.all(slice.map((it, j) => fn(it, i + j)))));
  }
  return out;
}

async function main() {
  /*
    Independent streams rather than one shared generator. Products are only
    created on the first run, so a single stream would sit at a different
    position by the time the orders were built and a re-run would produce a
    different history than the run before it.
  */
  const catalogueRandom = rng(20260819);
  const random = rng(770118);
  const personaRandom = rng(31415926);

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

  const realBuyers = await prisma.users.findMany({
    where: { email: { not: { startsWith: BUYER_EMAIL_PREFIX } } },
    select: { id: true, name: true },
  });
  if (realBuyers.length === 0) {
    throw new Error("No real users in the database — orders and reviews need a buyer.");
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
    // relations are required, so children have to go before parents.
    await prisma.notifications.deleteMany({
      where: { redirect_link: { in: ids.map((id) => `/order/${id}`) } },
    });
    await prisma.orderItems.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orders.deleteMany({ where: { id: { in: ids } } });
    console.log(`  cleaned ${ids.length} order(s) from a previous run`);
  }

  // Synthetic shoppers go only after their orders are gone, or the required
  // `orders.user` relation refuses the delete.
  const staleBuyers = await prisma.users.findMany({
    where: { email: { startsWith: BUYER_EMAIL_PREFIX } },
    select: { id: true },
  });
  if (staleBuyers.length > 0) {
    const ids = staleBuyers.map((u) => u.id);
    await prisma.shopReviews.deleteMany({ where: { userId: { in: ids } } });
    await prisma.userAnalytics.deleteMany({ where: { userId: { in: ids } } });
    await prisma.users.deleteMany({ where: { id: { in: ids } } });
    console.log(`  cleaned ${ids.length} synthetic buyer(s) from a previous run`);
  }

  /* ------------------------------------------------------------- products -- */

  const productIds: string[] = [];
  const idsByPersona = new Map<string, string[]>();
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

    const created =
      existing ??
      (await prisma.products.create({
        data: {
          title: p.title,
          slug,
          category: p.category,
          subCategory: p.subCategory,
          short_description: `${p.title} — seeded for demo.`,
          detailed_description: `Full detailed description for ${p.title}. Seeded sample content for local development.`,
          tags: p.tags,
          stock: p.stock,
          sale_price: p.sale_price,
          regular_price: p.regular_price,
          totalSales: 0,
          ratings: Number((3.6 + catalogueRandom() * 1.4).toFixed(1)),
          brand: p.brand,
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
    const bucket = idsByPersona.get(p.persona);
    if (bucket) bucket.push(created.id);
    else idsByPersona.set(p.persona, [created.id]);

    /*
      Attached outside the create/skip branch above, so a re-run backfills
      products that already exist. Still a separate create rather than a nested
      one, and still tolerant of P2002: if the images unique indexes are ever
      reintroduced, a failed image should not take the whole product down.
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
    `  ${productIds.length} product(s) across ${idsByPersona.size} personas` +
      ` — ${imagesAttached} image(s) attached` +
      (imagesBlocked > 0
        ? `, ${imagesBlocked} blocked by the images unique-index bug`
        : "")
  );

  const priceOf = new Map(
    (
      await prisma.products.findMany({
        where: { id: { in: productIds } },
        select: { id: true, sale_price: true, title: true },
      })
    ).map((p) => [p.id, p])
  );

  const soldPerProduct = new Map<string, number>();
  const noteSale = (productId: string, qty: number) =>
    soldPerProduct.set(productId, (soldPerProduct.get(productId) ?? 0) + qty);

  /* ------------------------------------------------- orders: real buyers -- */

  const orderIds: { id: string; status: string; title: string }[] = [];

  for (let i = 0; i < DELIVERY_SPREAD.length; i++) {
    const deliveryStatus = DELIVERY_SPREAD[i];
    const buyer = realBuyers[i % realBuyers.length];

    const itemCount = 1 + Math.floor(random() * 3);
    const chosen = new Set<string>();
    while (chosen.size < Math.min(itemCount, productIds.length)) {
      chosen.add(productIds[Math.floor(random() * productIds.length)]);
    }

    const items = [...chosen].map((productId) => {
      const quantity = 1 + Math.floor(random() * 3);
      noteSale(productId, quantity);
      return { productId, quantity, price: priceOf.get(productId)!.sale_price };
    });

    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const order = await prisma.orders.create({
      data: {
        userId: buyer.id,
        shopId: shop.id,
        total: Number(total.toFixed(2)),
        sessionId: `${SESSION_PREFIX}${i}`,
        status: "Paid",
        deliveryStatus,
        // Spread across roughly two months so the sales chart has a shape.
        createdAt: daysAgo(Math.floor(i * 4 + random() * 3)),
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

  console.log(`  ${orderIds.length} order(s) for real accounts`);

  /* -------------------------------------------- buyers: persona-driven -- */

  const personas = [...idsByPersona.keys()];

  const buyerRows = Array.from({ length: BUYER_COUNT }, (_, i) => {
    const n = String(i + 1).padStart(3, "0");
    return {
      name: `Seed Buyer ${n}`,
      email: `${BUYER_EMAIL_PREFIX}${n}@example.invalid`,
      role: "user",
    };
  });

  await prisma.users.createMany({ data: buyerRows });

  const synthetic = await prisma.users.findMany({
    where: { email: { startsWith: BUYER_EMAIL_PREFIX } },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  console.log(`  ${synthetic.length} synthetic buyer(s) created`);

  /*
    Each buyer belongs to a persona and draws most of a basket from it. The
    crossover is what keeps the index from collapsing into six disconnected
    islands — real shoppers do buy outside their habits, and those purchases are
    what link the clusters.
  */
  let syntheticOrders = 0;

  await inBatches(synthetic, 25, async (buyer, index) => {
    const persona = personas[index % personas.length];
    const pool = idsByPersona.get(persona)!;
    const orderCount = 1 + Math.floor(personaRandom() * 3);

    for (let o = 0; o < orderCount; o++) {
      const itemCount = 2 + Math.floor(personaRandom() * 4);
      const chosen = new Set<string>();

      let guard = 0;
      while (chosen.size < itemCount && guard++ < 50) {
        const fromPersona = personaRandom() > CROSSOVER_RATE;
        const source = fromPersona ? pool : productIds;
        chosen.add(source[Math.floor(personaRandom() * source.length)]);
      }

      const items = [...chosen].map((productId) => {
        const quantity = 1 + Math.floor(personaRandom() * 2);
        noteSale(productId, quantity);
        return { productId, quantity, price: priceOf.get(productId)!.sale_price };
      });

      const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

      await prisma.orders.create({
        data: {
          userId: buyer.id,
          shopId: shop.id,
          total: Number(total.toFixed(2)),
          sessionId: `${SESSION_PREFIX}b${index}-${o}`,
          status: "Paid",
          deliveryStatus: "Delivered",
          createdAt: daysAgo(Math.floor(personaRandom() * 120)),
          items: { create: items },
        },
        select: { id: true },
      });
      syntheticOrders++;
    }
  });

  console.log(`  ${syntheticOrders} order(s) from synthetic buyers`);

  /* ------------------------------------------------- sales and analytics -- */

  await inBatches([...soldPerProduct.entries()], 20, async ([productId, sold]) => {
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
        views: sold * 8 + Math.floor(random() * 200),
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
  });

  console.log(`  analytics written for ${soldPerProduct.size} product(s)`);

  /* -------------------------------------------------------------- reviews -- */

  // Reviews come from the real accounts only — a shop wall of 200 identical
  // synthetic ratings would say nothing and drown the two that are real.
  for (const buyer of realBuyers) {
    const already = await prisma.shopReviews.findFirst({
      where: { userId: buyer.id, shopId: shop.id },
      select: { id: true },
    });
    if (already) continue;

    await prisma.shopReviews.create({
      data: { userId: buyer.id, shopId: shop.id, rating: 4 + Math.round(random()) },
    });
  }

  const reviews = await prisma.shopReviews.findMany({
    where: { shopId: shop.id },
    select: { rating: true },
  });

  if (reviews.length > 0) {
    const mean = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await prisma.shops.update({
      where: { id: shop.id },
      data: { ratings: Number(mean.toFixed(2)), totalRating: reviews.length },
    });
  }

  console.log(`  ${reviews.length} shop review(s)`);

  /* -------------------------------------------------------- notifications -- */

  /*
    Only for the real accounts' orders — these exist so the Notifications pages
    have something to render, and 400 synthetic ones would bury that.
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
      `   buyers    ${synthetic.length} synthetic + ${realBuyers.length} real\n` +
      `   orders    ${await prisma.orders.count({ where: { shopId: shop.id } })}\n` +
      `   revenue   $${(revenue._sum.total ?? 0).toFixed(2)}\n` +
      `\n   Next: npm run build-recommendations\n`
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
