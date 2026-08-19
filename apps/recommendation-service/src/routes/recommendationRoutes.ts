import express, { Router } from "express";

import {
  getRecommendedProducts,
  getRelatedProducts,
  rebuildIndex,
} from "../controllers/recommendationController";
import { optionalAuth } from "../middleware/optionalAuth";
import { isAdmin } from "../../../../packages/middleware/isAdmin";

const router: Router = express.Router();

/*
  `optionalAuth` rather than `isAuthenticated`: the storefront home page calls
  this on load and is public, so a signed-out visitor must get the popular shelf
  rather than a 401 — which user-ui's axios interceptor would turn into a
  redirect to /login.
*/
router.get("/get-recommendation-products", optionalAuth, getRecommendedProducts);

// Product pages are public, and so is "you might also like" on them.
router.get("/get-related-products/:productId", getRelatedProducts);

router.post("/rebuild-index", isAdmin, rebuildIndex);

export default router;
