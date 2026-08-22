/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
//import * as path from 'path';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from "morgan";
import rateLimit from 'express-rate-limit';
//import swaggerUi from "swagger-ui-express";
import cookieParser from 'cookie-parser';
import { initializeSiteConfig } from './libs/initializeSiteConfig';
import { ALLOWED_ORIGINS } from "../../../packages/utils/cors";
//import axios from 'axios';



const app = express();

/*
  Every downstream target used to be a bare `http://localhost:PORT` literal,
  which meant the gateway could only ever reach services running on its own
  machine. The env var wins where it is set and the localhost value stays as the
  default, so local development is unchanged and a deploy only has to supply the
  seven variables below. Same shape `kafka-service` already uses for CORS_ORIGIN.
*/
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:6001";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:6002";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:6004";
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || "http://localhost:6005";
const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:6006";
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || "http://localhost:6008";
const SELLER_SERVICE_URL = process.env.SELLER_SERVICE_URL || "http://localhost:6009";

app.use(cors({
  origin: ALLOWED_ORIGINS,
  allowedHeaders: ['Authorization', 'Content-Type',],
  credentials: true //if credentials true then we cannot use origin "*"
}));

app.use(morgan('dev'));

/*
  Stripe signs the exact bytes of the webhook body, and order-service is careful
  to register `bodyParser.raw()` before its own `express.json()` for that reason.
  Parsing here would undo all of it: express-http-proxy re-serialises a body that
  has already been parsed, so the bytes Stripe signed are not the bytes that
  arrive, and `constructEvent` rejects the signature.

  Skipping the parser leaves the request streaming straight through to
  order-service, which then applies its own raw parser. Harmless if the webhook
  is pointed directly at order-service rather than through the gateway.
*/
const STRIPE_WEBHOOK_PATH = "/order/api/create-order";

const skipBodyParsingForWebhook = (
  parser: express.RequestHandler
): express.RequestHandler => (req, res, next) =>
  req.originalUrl.startsWith(STRIPE_WEBHOOK_PATH) ? next() : parser(req, res, next);

app.use(skipBodyParsingForWebhook(express.json({ limit: "100mb" })));
app.use(skipBodyParsingForWebhook(express.urlencoded({ limit: "100mb", extended: true })));
app.use(cookieParser());
app.set("trust proxy", 1);

//rate limit logic

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: any) => (req.user ? 1000 : 100),
  message: "Too many requests",
  standardHeaders: true,
  legacyHeaders: false,
  /*
    No custom keyGenerator on purpose. `(req) => req.ip` buckets IPv6 clients by
    their full address, and a single ISP customer is handed a whole /64 — so one
    caller could rotate addresses and never hit the limit. The library's default
    normalises the prefix; overriding it with req.ip is exactly what v7+ warns
    about.
  */
});

app.use(limiter);

app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});
app.use("/seller", proxy(SELLER_SERVICE_URL));
app.use("/recommendation", proxy(RECOMMENDATION_SERVICE_URL));
app.use("/chatting", proxy(CHAT_SERVICE_URL));
app.use("/admin", proxy(ADMIN_SERVICE_URL));
app.use("/order", proxy(ORDER_SERVICE_URL));
app.use("/product", proxy(PRODUCT_SERVICE_URL));

app.use("/", proxy(AUTH_SERVICE_URL));


const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  try {
    initializeSiteConfig();
    console.log("Site Config Initialized");
  } catch (error) {
    console.error("Failed to initialize site config:",error);
  }
});
server.on('error', console.error);
