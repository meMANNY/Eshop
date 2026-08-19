import express, { Router } from "express";
import {
    loginUser,
    resetUserPassword,
    userRegistration,
    verifyUser,
    userForgotPassword,
    verifyUserForgotPassword,
    refreshToken,
    getUser,
    registerSeller,
    verifySeller,
    createShop,
    loginSeller,
    createStripeAccountLink,
    getSeller,
    getUserAddresses,
    addUserAddress,
    deleteUserAddress,
    updateSellerProfile,
    getShopReviews,
    updateUserPassword,
    loginAdmin,
    getAdmin,
    logoutAccount
} from "../controller/auth.controller";
import { isAdmin } from "../../../../packages/middleware/isAdmin";
import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";
import { isSeller } from "../../../../packages/middleware/isSeller";
import { authorizeRoles } from "../../../../packages/middleware/authorizeRoles";

const router: Router = express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.post("/forgot-password-user", userForgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-otp", verifyUserForgotPassword);
router.post("/refresh-token", refreshToken);
router.get("/logged-in-user", isAuthenticated, authorizeRoles("user"), getUser);
router.post("/seller-registration", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
router.post("/login-seller", loginSeller);
router.post("/create-stripe-link", createStripeAccountLink);
router.get("/logged-in-seller", isSeller, authorizeRoles("seller"), getSeller);
router.put("/update-seller-profile", isSeller, authorizeRoles("seller"), updateSellerProfile);
router.get("/get-shop-reviews", isSeller, authorizeRoles("seller"), getShopReviews);
router.get("/shipping-addresses",isAuthenticated,getUserAddresses)
router.post("/add-address",isAuthenticated,addUserAddress)
router.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress);
router.post("/change-password", isAuthenticated, updateUserPassword);
router.post("/login-admin",loginAdmin);
router.get("/logged-in-admin",isAdmin,getAdmin);

/*
  No auth middleware on purpose: an expired session is exactly when you need to
  log out, and gating this behind a valid token would leave you unable to. The
  body's `role` picks which cookie namespace to expire — all three apps share one
  cookie jar on localhost, since cookies ignore the port.
*/
router.post("/logout", logoutAccount);

export default router;