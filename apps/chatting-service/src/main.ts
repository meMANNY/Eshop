import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// import { createWebSocketServer } from "./websocket";
// import { startConsumer } from "./chat-message-consumer";

import router from "./routes/chatting.route";
import { errorMiddleware } from "../../../packages/error-handler/error-middleware";


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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.get("/docs-json", (req, res) => {
//   res.json(swaggerDocument);
// });

app.get("/", (req, res) => {
  res.send({ message: "Welcome to chatting-service!" });
});

app.use("/api", router);
app.use(errorMiddleware);

const port = process.env.PORT || 6008;
const server = app.listen(port, () => {
  console.log(`Chatting service listening at http://localhost:${port}/api`);
  console.log(`Swagger Docs available at http://localhost:${port}/api-docs`);
});

// websocket server
//createWebSocketServer(server);

// start kafka consumer
//startConsumer().catch((err: any) => console.error(err));

server.on("error", (err) => {
  console.log("Server Error :", err);
});