import {kafka} from "../../../packages/utils/kafka/index";
import { updateUserAnalytics } from "./services/analytics-service";
import express from "express";
import cors from "cors";
import { getProducer } from "../../../packages/utils/kafka/producer";
import { logAsync, setLogSource } from "../../../packages/utils/logs/send-logs";

setLogSource("kafka-service");

const consumer = kafka.consumer({groupId: "user-events-group"});

const eventQueue: any[] = [];

const validActions = [
  "product_view",
  "add_to_cart",
  "remove_from_cart",
  "add_to_wishlist",
  "remove_from_wishlist",
  "purchase",
  "shop_visit",
];

const processQueue = async () => {

  if(!eventQueue.length) return;

  const events = eventQueue.splice(0, eventQueue.length);

  for(const event of events){
    try{
        if(!event.action || !validActions.includes(event.action)){
            console.warn("Invalid action received:", event.action);
            continue;
        }
        await updateUserAnalytics(event);
    }
    catch(err){
        console.error("Error processing event:", err,"payload:", event);
        logAsync({ type: "error", message: `Analytics event failed (${event?.action}): ${(err as Error)?.message}` });
    }
  }

};

setInterval(processQueue, 3000);

export const consumeKafkaMessages = async () =>{

  await consumer.connect();
  
  await consumer.subscribe({topic: "user-events", fromBeginning: true});

  consumer.on(consumer.events.CRASH, (e) =>{
    console.error("Kafka consumer crashed:", e.payload);
    logAsync({ type: "error", message: "Kafka consumer crashed - analytics ingestion has stopped" });
  })
  consumer.on(consumer.events.GROUP_JOIN,(e)=>{
    console.log("Kafka consumer group joined:", e.payload);
  });

  await consumer.run({
    eachMessage: async({topic, partition, message})=>{
      if(!message.value) return;

      const raw = message.value.toString();
      console.log(`${topic}[${partition} | ${message.offset}] / ${message.timestamp} - ${raw}`);

      try{
        const event = JSON.parse(raw);
        eventQueue.push(event);
      }catch(err){
        console.error("Error parsing Kafka message:", err,"raw message:", raw);
      }
    }
  })
}

consumeKafkaMessages().catch((err) => {
  console.error("Fatal consumer error:", err);
  process.exit(1);
});

const PORT = Number(process.env.KAFKA_HTTP_PORT || 6010);
const ALLOW_ORIGINS = process.env.CORS_ORIGIN?.split(",").map((s) =>
  s.trim()
) || ["http://localhost:3000", "http://localhost:8080"];

const app = express();

app.use(
  cors({
    origin: ALLOW_ORIGINS,
    credentials: false,
  })
);
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

app.post("/track", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    if (!payload.action) {
      return res.status(400).json({ error: "Missing 'action'" });
    }

    const msg = {
      userId: payload.userId ?? null,
      productId: payload.productId ?? null,
      shopId: payload.shopId ?? null,
      action: String(payload.action),
      country: payload.country ?? "Unknown",
      city: payload.city ?? "Unknown",
      device: payload.device ?? "Unknown Device",
      timestamp: new Date().toISOString(),
    };

    const producer = await getProducer();
    await producer.send({
      topic: "user-events",
      messages: [{ value: JSON.stringify(msg) }],
    });

    return res.json({ ok: true });
  } catch (e: any) {
    console.error("track route error:", e);
    logAsync({ type: "error", message: `/track failed: ${e?.message}` });
    return res.status(500).json({ error: e?.message || "internal" });
  }
});

app.listen(PORT, () => {
  console.log(`Kafka tracking HTTP listening on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  try {
    console.log("Shutting down kafka-service...");
    await consumer.disconnect().catch(() => {});
  } finally {
    process.exit(0);
  }
});
