import prisma from "../../../../packages/libs/primsa";

/*
  Serving recommendations. Every expensive thing already happened in
  `similarity.ts`, so this is: read what the shopper has touched, look up the
  precomputed neighbours of those products, add up the scores, rank.

  Nothing here trains, fits, or allocates a tensor. Training on the request path
  was the root problem with the model approach — and beyond the latency, that
  version could only ever return products the shopper had already interacted
  with, because the candidate set was built from their own history.
*/

/** What each kind of interaction says about intent. */
const ACTION_WEIGHT: Record<string, number> = {
  purchase: 1,
  add_to_cart: 0.7,
  add_to_wishlist: 0.5,
  product_view: 0.15,
  // A removal retracts the interest the matching add recorded.
  remove_from_cart: -0.7,
  remove_from_wishlist: -0.5,
};

/** Most recent interactions only — taste from two years ago is not taste. */
const MAX_SEEDS = 40;

/** The oldest seed in the window counts this much next to the newest. */
const RECENCY_FLOOR = 0.4;

type Seed = { productId: string; weight: number };

type ActionRow = {
  productId?: string;
  action?: string;
  timestamp?: string | Date;
  /** `order.controller` writes this spelling, with a numeric value. */
  timeStamp?: number;
};

function actionTime(a: ActionRow): number {
  if (typeof a.timeStamp === "number") return a.timeStamp;
  if (a.timestamp) return new Date(a.timestamp).getTime();
  return 0;
}

/* ------------------------------------------------------------------ seeds -- */

/**
 * What this shopper has shown interest in, strongest first, plus everything they
 * already own so it can be kept out of the results.
 */
async function gatherSeeds(userId: string): Promise<{
  seeds: Seed[];
  owned: Set<string>;
}> {
  const owned = new Set<string>();

  const orders = await prisma.orders.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { items: { select: { productId: true } } },
  });
  for (const order of orders) {
    for (const item of order.items) owned.add(item.productId);
  }

  const analytics = await prisma.userAnalytics.findUnique({
    where: { userId },
    select: { actions: true },
  });

  const rows: ActionRow[] = Array.isArray(analytics?.actions)
    ? (analytics?.actions as ActionRow[])
    : [];

  const recent = rows
    .filter((a) => a?.productId && a?.action)
    .sort((a, b) => actionTime(b) - actionTime(a))
    .slice(0, MAX_SEEDS);

  // Net interest per product: a later removal cancels an earlier add.
  const weights = new Map<string, number>();

  recent.forEach((a, i) => {
    const base = ACTION_WEIGHT[a.action as string];
    // `shop_visit` and anything unrecognised carry no product signal.
    if (base === undefined) return;

    // Linear decay from 1 down to RECENCY_FLOOR across the window.
    const recency =
      recent.length <= 1
        ? 1
        : 1 - (i / (recent.length - 1)) * (1 - RECENCY_FLOOR);

    const id = a.productId as string;
    weights.set(id, (weights.get(id) ?? 0) + base * recency);
  });

  // A purchase is the strongest statement of taste there is, and it may predate
  // the analytics window entirely.
  for (const productId of owned) {
    weights.set(
      productId,
      (weights.get(productId) ?? 0) + ACTION_WEIGHT.purchase
    );
  }

  const seeds = [...weights.entries()]
    .filter(([, weight]) => weight > 0)
    .map(([productId, weight]) => ({ productId, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_SEEDS);

  return { seeds, owned };
}

/* -------------------------------------------------------------- fallbacks -- */

/**
 * What to show someone we know nothing about, and how any short result set gets
 * topped up. Popularity is a weak recommendation but it is never empty, and an
 * empty shelf is the worst answer a storefront can give.
 */
async function popular(limit: number, exclude: Set<string>) {
  if (limit <= 0) return [];

  const rows = await prisma.products.findMany({
    where: {
      isDeleted: false,
      status: "Active",
      ...(exclude.size > 0 ? { id: { notIn: [...exclude] } } : {}),
    },
    orderBy: [{ totalSales: "desc" }, { ratings: "desc" }],
    take: limit,
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function hydrate(ids: string[]) {
  if (ids.length === 0) return [];

  const products = await prisma.products.findMany({
    where: { id: { in: ids } },
    include: { images: true, Shop: { select: { id: true, name: true } } },
  });

  // `findMany` returns documents in storage order, not the ranked order we asked
  // for, so the ranking is reapplied here.
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/* ------------------------------------------------------------------ serve -- */

export type Recommendation = {
  productId: string;
  score: number;
  /** Why this product is here, carried through from the index. */
  reason: string;
};

/** Ranked product ids for a shopper, each with the reason it earned its place. */
export async function rankForUser(
  userId: string,
  limit = 10
): Promise<Recommendation[]> {
  const { seeds, owned } = await gatherSeeds(userId);

  if (seeds.length === 0) {
    const ids = await popular(limit, owned);
    return ids.map((productId) => ({ productId, score: 0, reason: "popular" }));
  }

  const index = await prisma.productSimilarity.findMany({
    where: { productId: { in: seeds.map((s) => s.productId) } },
    select: { productId: true, neighbours: true },
  });

  const seedWeight = new Map(seeds.map((s) => [s.productId, s.weight]));
  const scores = new Map<string, { score: number; reason: string }>();

  for (const row of index) {
    const weight = seedWeight.get(row.productId) ?? 0;
    for (const n of row.neighbours) {
      if (owned.has(n.productId)) continue;
      if (seedWeight.has(n.productId)) continue; // already engaged with it

      const current = scores.get(n.productId);
      if (!current) {
        scores.set(n.productId, { score: n.score * weight, reason: n.reason });
      } else {
        current.score += n.score * weight;
        // Surfaced by both signals: describe it by the stronger claim.
        if (n.reason === "bought-together") current.reason = n.reason;
      }
    }
  }

  const ranked: Recommendation[] = [...scores.entries()]
    .map(([productId, v]) => ({ productId, score: v.score, reason: v.reason }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // A sparse index — a young catalogue, or a shopper whose seeds have no
  // neighbours yet — must still fill the shelf.
  if (ranked.length < limit) {
    const exclude = new Set<string>([
      ...owned,
      ...seedWeight.keys(),
      ...ranked.map((r) => r.productId),
    ]);
    const filler = await popular(limit - ranked.length, exclude);
    for (const productId of filler) {
      ranked.push({ productId, score: 0, reason: "popular" });
    }
  }

  return ranked;
}

/**
 * Cold start: nobody signed in, or nobody we have seen before. The catalogue's
 * best sellers are a weak recommendation but an honest one, and the home page
 * has to render something.
 */
export async function popularProducts(limit = 10) {
  const ids = await popular(limit, new Set());
  const products = await hydrate(ids);
  return products.map((p: any) => ({ ...p, reason: "popular" }));
}

/** The same ranking, with the product documents attached. */
export async function recommendForUser(userId: string, limit = 10) {
  const ranked = await rankForUser(userId, limit);
  const products = await hydrate(ranked.map((r) => r.productId));
  const reasons = new Map(ranked.map((r) => [r.productId, r.reason]));

  return products.map((p: any) => ({ ...p, reason: reasons.get(p.id) }));
}

/** "Related products" for a product page — no user needed, one indexed read. */
export async function relatedToProduct(productId: string, limit = 10) {
  const row = await prisma.productSimilarity.findUnique({
    where: { productId },
    select: { neighbours: true },
  });

  const neighbours = row?.neighbours ?? [];

  const ids = neighbours
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((n) => n.productId);

  if (ids.length < limit) {
    const filler = await popular(
      limit - ids.length,
      new Set([...ids, productId])
    );
    ids.push(...filler);
  }

  const products = await hydrate(ids);
  const reasons = new Map(neighbours.map((n) => [n.productId, n.reason]));

  return products.map((p: any) => ({
    ...p,
    reason: reasons.get(p.id) ?? "popular",
  }));
}
