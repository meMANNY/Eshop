import express, { Router } from "express";
import { createPaymentIntent, createPaymentSession, verifyPaymentSession, getOrderBySession, getSellerOrders, getUserOrders, getOrderDetails, updateDeliveryStatus, verifyCouponCode, getAdminOrders } from "../controllers/order.controller";
import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";
import { isSeller } from "../../../../packages/middleware/isSeller";
import { isAdmin } from "../../../../packages/middleware/isAdmin";

const router: Router = express.Router();


router.post("/create-payment-intent",isAuthenticated, createPaymentIntent);
router.post("/create-payment-session",isAuthenticated, createPaymentSession);
router.get("/verifying-payment-session",isAuthenticated, verifyPaymentSession);
router.get("/get-order-by-session/:sessionId", isAuthenticated, getOrderBySession);
router.get("/get-seller-orders",isSeller, getSellerOrders);
router.get("/get-user-orders",isAuthenticated, getUserOrders);
router.get("/get-order-details/:orderId",isAuthenticated,getOrderDetails);
router.get("/get-seller-order-details/:orderId",isSeller,getOrderDetails);
router.put("/update-status/:orderId",isSeller, updateDeliveryStatus);
router.post("/verify-coupon",isAuthenticated,verifyCouponCode);
router.get("/get-admin-orders",isAdmin,getAdminOrders);


export default router;