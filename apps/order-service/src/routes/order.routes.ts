import express, { Router } from "express";
import { createPaymentIntent, createPaymentSession, verifyPaymentSession, getOrderBySession, getSellerOrders, getUserOrders, getOrderDetails } from "../controllers/order.controller";
import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";
import { isSeller } from "../../../../packages/middleware/isSeller";

const router: Router = express.Router();


router.post("/create-payment-intent",isAuthenticated, createPaymentIntent);
router.post("/create-payment-session",isAuthenticated, createPaymentSession);
router.get("/verifying-payment-session",isAuthenticated, verifyPaymentSession);
router.get("/get-order-by-session/:sessionId", isAuthenticated, getOrderBySession);
router.get("/get-seller-orders",isSeller, getSellerOrders);
router.get("/get-user-orders",isAuthenticated, getUserOrders);
router.get("/get-order-details/:orderId",isAuthenticated,getOrderDetails);

export default router;