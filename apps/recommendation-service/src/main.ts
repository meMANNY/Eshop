import express from "express";
import cookieParser from "cookie-parser";

import { errorMiddleware } from "../../../packages/error-handler/error-middleware";
import { setLogSource } from "../../../packages/utils/logs/send-logs";

// Names every log this process emits, so call sites never repeat it.
setLogSource("recommendation-service");

import router from "./routes/recommendationRoutes";

const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to recommendation-service!" });
});

// routes
app.use("/api", router);

/*
  Required, not decorative: the controllers hand failures to `next(err)`, and
  without this Express answers them with its own HTML error page instead of the
  JSON shape every other service in this repo returns.
*/
app.use(errorMiddleware);

const port = process.env.PORT || 6006;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);