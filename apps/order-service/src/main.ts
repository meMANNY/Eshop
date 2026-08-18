/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import {errorMiddleware } from "../../../packages/error-handler/error-middleware";
import { setLogSource } from "../../../packages/utils/logs/send-logs";

// Names every log this process emits, so call sites never repeat it.
setLogSource("order-service");
import router from "./routes/order.routes";
import { createOrder } from './controllers/order.controller';

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);


// Stripe signs the exact bytes of the request body, so this route MUST be
// registered before express.json(). Once the JSON parser consumes the stream it
// sets req._body, which makes bodyParser.raw() below skip as a no-op — leaving
// req.body a parsed object that can no longer be signature-verified.
app.post(
  "/api/create-order",
  bodyParser.raw({ type: "application/json" }),
  (req, res, next) => {
    (req as any).rawBody = req.body;
    console.log("🟡 Stripe webhook received at:", new Date().toISOString());
    next();
  },
  createOrder
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send({ message: "Welcome to order-service!" });
});
app.use("/api", router);

// Error handlers run only if registered after every route they should cover.
app.use(errorMiddleware);

const port = process.env.PORT || 6004;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/`);
});
server.on('error', console.error);
