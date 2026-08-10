import express, { Router } from "express";
import { createPaymentIntent, createPaymentSession,verifyPaymentSession, getOrderBySession } from "../controllers/order.controller";
import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";

const router: Router = express.Router();


router.post("/create-payment-intent",isAuthenticated, createPaymentIntent);
router.post("/create-payment-session",isAuthenticated, createPaymentSession);
router.get("/verifying-payment-session",isAuthenticated, verifyPaymentSession);
router.get("/get-order-by-session/:sessionId", isAuthenticated, getOrderBySession);

export default router;