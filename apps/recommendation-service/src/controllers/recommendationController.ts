import { NextFunction, Request, Response } from "express";
import { ValidationError } from "../../../../packages/error-handler";
import { logAsync } from "../../../../packages/utils/logs/send-logs";
import {
  recommendForUser,
  popularProducts,
  relatedToProduct,
} from "../services/recommendationService";
import { buildSimilarityIndex } from "../services/similarity";

const isObjectId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

/** Keeps a caller from asking for the whole catalogue in one page. */
function readLimit(raw: unknown, fallback = 10) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), 1), 50);
}

/**
 * The storefront's "Picked for you" shelf. Personalised when we know who is
 * asking, most popular when we do not — the home page is public, so this must
 * always answer.
 */
export const getRecommendedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const limit = readLimit(req.query.limit);

    const recommendations = userId
      ? await recommendForUser(userId, limit)
      : await popularProducts(limit);

    // Personalised and cheap to recompute; never let a shared cache hand one
    // shopper's shelf to another.
    res.setHeader("Cache-Control", "no-store");

    // The home page reads `res.data.recommendations`.
    return res.status(200).json({ success: true, recommendations });
  } catch (err) {
    return next(err);
  }
};

/** "You might also like" for a product page. No session needed. */
export const getRelatedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    if (!isObjectId(productId))
      return next(
        new ValidationError(
          "Invalid request data",
          "A valid product ID is required"
        )
      );

    const recommendations = await relatedToProduct(
      productId,
      readLimit(req.query.limit)
    );

    return res.status(200).json({ success: true, recommendations });
  } catch (err) {
    return next(err);
  }
};

/*
  The index build is the expensive half of this service and is deliberately not
  reachable from a shopper's request. Admin-only, and it answers immediately
  rather than holding the connection open for the whole scan.
*/
let building = false;

export const rebuildIndex = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (building)
      return res
        .status(409)
        .json({ success: false, message: "An index build is already running" });

    building = true;
    res.status(202).json({ success: true, message: "Index build started" });

    buildSimilarityIndex()
      .then((report) => console.log("Similarity index rebuilt:", report))
      .catch((err) =>
        logAsync({
          type: "error",
          message: `Similarity index build failed: ${err?.message}`,
        })
      )
      .finally(() => {
        building = false;
      });

    return;
  } catch (err) {
    building = false;
    return next(err);
  }
};
