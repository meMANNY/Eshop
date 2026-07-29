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
    getSeller
} from "../controller/auth.controller";
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
router.post("/refresh-token-user", refreshToken);
router.get("/logged-in-user", isAuthenticated, authorizeRoles("user"), getUser);
router.post("/seller-registration", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
router.post("/login-seller", loginSeller);
router.post("/create-stripe-link", createStripeAccountLink);
router.get("/logged-in-seller", isSeller, authorizeRoles("seller"), getSeller);
export default router;