import {kafka} from "../../../../packages/utils/kafka/index";

const producer = kafka.producer();

export async function sendKafkaEvent(eventData: {
    userId?: string;
    productId?: string;
    shopId?: string;
    action: string;
    country?: string;
    city?: string;
    device?: string;
}) {

    try{

        await producer.connect();
        await producer.send({
            topic: "user-events",
            messages: [
                { value: JSON.stringify(eventData) }
            ]
        });
    }catch(err){
        console.error("Error sending Kafka event:", err, "payload:", eventData);
    }finally{
        await producer.disconnect();
    }


};

