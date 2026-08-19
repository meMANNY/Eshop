import prisma from "../../../../packages/libs/primsa";
import { logAsync } from "../../../../packages/utils/logs/send-logs";

/*
  Builds the neighbour index that `recommendationService` reads at request time.
  Nothing in here runs on a request — it is a job, and it is the reason serving a
  recommendation is two indexed queries instead of training a model per visitor.

  Two signals, deliberately kept apart:

    bought-together  co-occurrence across users' purchase histories, cosine
                     normalised. The strongest signal there is, and useless
                     until enough different people have bought enough things.

    similar          shared category, sub-category, brand and tags. Works from
                     the very first product with no traffic at all, which is why
                     it is not merely a fallback — on a young catalogue it is
                     what actually serves.

  Co-occurrence wins the top slots; content fills the rest. Each neighbour keeps
  the reason it earned its place so the storefront can say which claim it is
  making.
*/

const MAX_NEIGHBOURS = 50;

/** How much each content feature counts toward similarity. */
const W_SUBCATEGORY = 3;
const W_CATEGORY = 2;
const W_BRAND = 1.5;
const W_TAG = 1;

/** Below this, a co-occurrence is one person's coincidence rather than a signal. */
const MIN_COOCCURRENCE = 2;

const ORDER_PAGE = 500;

type Neighbour = { productId: string; score: number; reason: string };

type ProductRow = {
  id: string;
  category: string | null;
  subCategory: string | null;
  brand: string | null;
  tags: string[];
};

export type BuildReport = {
  products: number;
  buyers: number;
  boughtTogetherPairs: number;
  indexed: number;
  ms: number;
};

/* ------------------------------------------------------- bought together -- */

/**
 * Co-occurrence is counted per *buyer*, not per order — two separate orders from
 * the same person still say those products go together, and a basket-only view
 * throws that away.
 */
async function boughtTogether(): Promise<{
  sim: Map<string, Map<string, number>>;
  buyers: number;
  pairs: number;
}> {
  const byUser = new Map<string, Set<string>>();

  // Paginated by id so a large order table never lands in memory at once.
  let cursor: string | undefined;
  for (;;) {
    const page = await prisma.orders.findMany({
      take: ORDER_PAGE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, userId: true, items: { select: { productId: true } } },
    });
    if (page.length === 0) break;

    for (const order of page) {
      let set = byUser.get(order.userId);
      if (!set) byUser.set(order.userId, (set = new Set()));
      for (const item of order.items) set.add(item.productId);
    }

    cursor = page[page.length - 1].id;
    if (page.length < ORDER_PAGE) break;
  }

  // How many distinct buyers bought each product — the cosine denominator.
  const owners = new Map<string, number>();
  for (const set of byUser.values()) {
    for (const id of set) owners.set(id, (owners.get(id) ?? 0) + 1);
  }

  const co = new Map<string, Map<string, number>>();
  const bump = (a: string, b: string) => {
    let row = co.get(a);
    if (!row) co.set(a, (row = new Map()));
    row.set(b, (row.get(b) ?? 0) + 1);
  };

  for (const set of byUser.values()) {
    const ids = [...set];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        bump(ids[i], ids[j]);
        bump(ids[j], ids[i]);
      }
    }
  }

  let pairs = 0;
  const sim = new Map<string, Map<string, number>>();

  for (const [a, row] of co) {
    const scored = new Map<string, number>();
    for (const [b, count] of row) {
      if (count < MIN_COOCCURRENCE) continue;
      // Cosine on the binary buyer-item matrix: co(a,b) / sqrt(|a| * |b|).
      // Without the denominator a bestseller would be everyone's neighbour.
      const denom = Math.sqrt((owners.get(a) ?? 1) * (owners.get(b) ?? 1));
      if (denom > 0) {
        scored.set(b, count / denom);
        pairs++;
      }
    }
    if (scored.size > 0) sim.set(a, scored);
  }

  return { sim, buyers: byUser.size, pairs };
}

/* ---------------------------------------------------------------- similar -- */

/** A product as a sparse bag of weighted features. */
function features(p: ProductRow): Map<string, number> {
  const f = new Map<string, number>();
  const put = (token: string, weight: number) =>
    f.set(token, (f.get(token) ?? 0) + weight);

  if (p.subCategory) put(`sub:${p.subCategory.toLowerCase()}`, W_SUBCATEGORY);
  if (p.category) put(`cat:${p.category.toLowerCase()}`, W_CATEGORY);
  if (p.brand) put(`brand:${p.brand.toLowerCase()}`, W_BRAND);
  for (const tag of p.tags ?? []) {
    if (tag) put(`tag:${String(tag).toLowerCase()}`, W_TAG);
  }
  return f;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  // Walk the shorter vector; the other is a lookup.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [token, weight] of small) {
    const other = large.get(token);
    if (other) dot += weight * other;
  }
  if (dot === 0) return 0;

  let na = 0;
  for (const w of a.values()) na += w * w;
  let nb = 0;
  for (const w of b.values()) nb += w * w;

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Content similarity is computed inside category buckets. Comparing every
 * product against every other is O(n²) and mostly wasted — a mug is not a
 * near-neighbour of a keyboard however the tags line up.
 */
function contentSimilarity(
  products: ProductRow[]
): Map<string, Map<string, number>> {
  const buckets = new Map<string, ProductRow[]>();
  for (const p of products) {
    const key = (p.category ?? "__none").toLowerCase();
    const bucket = buckets.get(key);
    if (bucket) bucket.push(p);
    else buckets.set(key, [p]);
  }

  const sim = new Map<string, Map<string, number>>();
  const vectors = new Map<string, Map<string, number>>();
  for (const p of products) vectors.set(p.id, features(p));

  for (const bucket of buckets.values()) {
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        const a = bucket[i].id;
        const b = bucket[j].id;
        const score = cosine(vectors.get(a)!, vectors.get(b)!);
        if (score <= 0) continue;

        let ra = sim.get(a);
        if (!ra) sim.set(a, (ra = new Map()));
        ra.set(b, score);

        let rb = sim.get(b);
        if (!rb) sim.set(b, (rb = new Map()));
        rb.set(a, score);
      }
    }
  }

  return sim;
}

/* ------------------------------------------------------------------ build -- */

export async function buildSimilarityIndex(): Promise<BuildReport> {
  const startedAt = Date.now();

  const products = (await prisma.products.findMany({
    where: { isDeleted: false, status: "Active" },
    select: {
      id: true,
      category: true,
      subCategory: true,
      brand: true,
      tags: true,
    },
  })) as ProductRow[];

  const live = new Set(products.map((p) => p.id));

  const { sim: cooc, buyers, pairs } = await boughtTogether();
  const content = contentSimilarity(products);

  let indexed = 0;

  for (const product of products) {
    const neighbours: Neighbour[] = [];
    const taken = new Set<string>([product.id]);

    // Co-occurrence first — a real purchase pattern outranks a shared tag.
    const bought = [...(cooc.get(product.id) ?? new Map())]
      .filter(([id]) => live.has(id))
      .sort((a, b) => b[1] - a[1]);

    for (const [productId, score] of bought) {
      if (neighbours.length >= MAX_NEIGHBOURS) break;
      if (taken.has(productId)) continue;
      taken.add(productId);
      neighbours.push({ productId, score, reason: "bought-together" });
    }

    const similar = [...(content.get(product.id) ?? new Map())]
      .filter(([id]) => live.has(id))
      .sort((a, b) => b[1] - a[1]);

    for (const [productId, score] of similar) {
      if (neighbours.length >= MAX_NEIGHBOURS) break;
      if (taken.has(productId)) continue;
      taken.add(productId);
      neighbours.push({ productId, score, reason: "similar" });
    }

    if (neighbours.length === 0) {
      // Nothing to say about this product. Clear any stale row rather than
      // leaving yesterday's neighbours to be served as today's answer.
      await prisma.productSimilarity.deleteMany({
        where: { productId: product.id },
      });
      continue;
    }

    await prisma.productSimilarity.upsert({
      where: { productId: product.id },
      create: { productId: product.id, neighbours, builtAt: new Date() },
      update: { neighbours, builtAt: new Date() },
    });
    indexed++;
  }

  const report: BuildReport = {
    products: products.length,
    buyers,
    boughtTogetherPairs: pairs,
    indexed,
    ms: Date.now() - startedAt,
  };

  logAsync({
    type: "success",
    message:
      `Similarity index rebuilt: ${report.indexed}/${report.products} products, ` +
      `${report.boughtTogetherPairs} bought-together pairs from ${report.buyers} buyers, ` +
      `${report.ms}ms`,
  });

  return report;
}
