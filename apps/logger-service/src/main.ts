import express from "express";
import { WebSocket } from "ws";
import http from "http";
// Imported for its side effect: the module starts the Kafka consumer itself.
import "./logger-consumer";

const app = express();

const wsServer = new WebSocket.Server({ noServer: true });

export const clients = new Set<WebSocket>();

wsServer.on("connection", (ws) => {
  console.log("New Logger Client Connected!");
  clients.add(ws);

  ws.on("close", () => {
    console.log("Logger Client Disconnected!");
    clients.delete(ws);
  });
});

const server = http.createServer(app);
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit("connection", ws, request);
  });
});
/*
  6008 belongs to chatting-service. Both services binding it meant whichever
  started second died with EADDRINUSE — so either chat or the log stream was
  always down, depending on start order.
*/
const port = process.env.PORT || 6007;
server.listen(port, () => {
  console.log(`Logger service listening at http://localhost:${port}/api`);
});

// The consumer starts itself at the bottom of logger-consumer.ts. Calling it
// again here connected the same consumer instance twice.