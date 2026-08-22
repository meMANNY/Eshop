import express, { Router } from "express";

import { isSeller } from "../../../../packages/middleware/isSeller"
import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";
import { isAnyAuthenticated } from "../../../../packages/middleware/isAnyAuthenticated";
import {
  deleteSeller,
  followShop,
  getSeller,
  getSellerEvents,
  getSellerProducts,
  getShopDeletionState,
  getShopSettings,
  getStripeAccount,
  isFollowingShop,
  markNotificationAsRead,
  restoreSeller,
  sellerNotifications,
  unfollowShop,
  updateShopSettings,
} from "../controller/seller.controller";

const router: Router = express.Router();

router.get("/get-shop-settings",isSeller, getShopSettings);
router.put(
  "/update-shop-settings",
  isAuthenticated,
  isSeller,
  updateShopSettings
);
router.delete("/delete-shop", isSeller, deleteSeller);
router.get(
  "/get-shop-deletion-state",
  isAuthenticated,
  isSeller,
  getShopDeletionState
);
router.put("/restore-shop", isSeller, restoreSeller);

// `isSeller`, not `isAuthenticated`: the controller reads `req.seller.id`, and
// only `isSeller` reads the `seller-access-token` cookie a seller session
// actually carries. Under `isAuthenticated` this route 401'd every seller —
// the same trap noted on mark-notification-as-read below.
router.get("/get-stripe-account", isSeller, getStripeAccount);

router.get("/get-seller-products/:shopId", getSellerProducts);
router.get("/get-seller-events/:shopId", getSellerEvents);
router.get("/is-following/:shopId", isAuthenticated, isFollowingShop);
router.post("/follow-shop", isAuthenticated, followShop);
router.post("/unfollow-shop", isAuthenticated, unfollowShop);
router.get("/get-seller/:id", getSeller);

router.get(
  "/seller-notifications",
  isSeller,
  sellerNotifications
);
// user-ui, seller-ui and admin-ui all post here, so this cannot be `isAuthenticated`
// — that only accepts the user cookie and 401s the other two.
router.post(
  "/mark-notification-as-read",
  isAnyAuthenticated,
  markNotificationAsRead
);

export default router;