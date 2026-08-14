import {kafka} from "../../../packages/utils/kafka";

import prisma from "../../../packages/libs/primsa";

import {Consumer,EachMessagePayload} from "kafkajs";
import { incrementUnseenCount } from "../../../packages/libs/redis/message.redis";


interface BufferedMessage{

    conversationId: string;
    senderId: string;
    senderType: string;
    content: string;
    createdAt: string;
}

const TOPIC = "chat.new_message";
const GROUP_ID = "chat-message-db-writer";
const BATCH_INTERVAL_MS = 3000; // 3 seconds
const MAX_BUFFER_SIZE = 5000;
const RESUME_THRESHOLD = 2000;
const MAX_BACKOFF = 60000;


let buffer: BufferedMessage[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let backoff = BATCH_INTERVAL_MS;
let consumer: Consumer | null = null;

//initalize the kafka consumer

export async function startConsumer(){

    consumer = kafka.consumer({ groupId: GROUP_ID });
    await consumer.connect();

    await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
    console.log(`Kafka consumer subscribed to topic: ${TOPIC}`);

    await consumer.run({
        autoCommit: false,
        eachMessage: async({message,topic,partition,heartbeat}: EachMessagePayload) => {
            if(!message.value) return;

            try{

                const parsed: BufferedMessage = JSON.parse(message.value.toString());

                (parsed as any).partition = partition;
                (parsed as any).offset = message.offset;
                buffer.push(parsed);



                if(buffer.length >= MAX_BUFFER_SIZE){
                    console.warn("Buffer full, pausing consumer...");
                    await consumer?.pause([{ topic: TOPIC }]);
                    setTimeout(() => {
                        console.log("Resuming consumer...");
                        consumer?.resume([{ topic: TOPIC }]);
                    }, MAX_BACKOFF);
                }

                if(buffer.length === 1 && !flushTimer){
                    flushTimer = setTimeout(() => flushBufferToDb(topic), BATCH_INTERVAL_MS);
                }

                await heartbeat();


            }catch(err){
                console.error("Error parsing message via Kafka:", err);
            }
        }
    })

}

//Flush the buffer to the database

async function flushBufferToDb(topic: string){
    const toInsert = buffer.splice(0, buffer.length);
    if(flushTimer){
        clearTimeout(flushTimer);
        flushTimer = null;
    }

    if(toInsert.length === 0) return;

    try{

        const prismaPayload = toInsert.map(msg => ({
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            senderType: msg.senderType,
            content: msg.content,
            createdAt: new Date(msg.createdAt),
        }));

        await prisma.message.createMany({
            data: prismaPayload,
        });

        //Redis unseen counter (only if db insert is successful)

        for(const msg of prismaPayload){
            const receiverType = msg.senderType === "user" ? "seller" : "user";
            await incrementUnseenCount(receiverType,msg.conversationId);
        }

        const lastByPartition = new Map<string,string>();

        for(const msg of toInsert as any[]){
            lastByPartition.set(msg.partition, msg.offset);
        }

        for(const [partition, offset] of lastByPartition){
            await consumer?.commitOffsets([{ topic, partition: parseInt(partition), offset: (parseInt(offset) + 1).toString() }]);
        }

        backoff = BATCH_INTERVAL_MS; // Reset backoff on success

        if(buffer.length < RESUME_THRESHOLD){
            consumer?.resume([{ topic: TOPIC }]);
            console.log("Resumed consumer after processing buffer.");
        }

        console.log(`Inserted ${prismaPayload.length} messages into the database and updated unseen counts.`);

    }catch(err){
        console.error("Error inserting messages into database:", err);
        buffer.unshift(...toInsert); // Re-add messages to the buffer for retry
        backoff = Math.min(backoff * 2, MAX_BACKOFF); // Exponential backoff
        console.log(`Retrying in ${backoff / 1000} seconds...`);
        setTimeout(() => flushBufferToDb(topic), backoff);
}
    }


