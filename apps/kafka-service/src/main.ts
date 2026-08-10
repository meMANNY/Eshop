import {kafka} from "../../../packages/utils/kafka/index";
import { updateUserAnalytics } from "./services/analytics-service";


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
    }
  }

};

setInterval(processQueue, 3000);

export const consumeKafkaMessages = async () =>{

  await consumer.connect();
  
  await consumer.subscribe({topic: "user-events", fromBeginning: true});

  consumer.on(consumer.events.CRASH, (e) =>{
    console.error("Kafka consumer crashed:", e.payload);
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
