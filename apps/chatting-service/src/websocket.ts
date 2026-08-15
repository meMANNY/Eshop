import {kafka} from "../../../packages/utils/kafka";
import {WebSocket, WebSocketServer} from "ws";
import  { Server as HttpServer} from "http";
import redis from "../../../packages/libs/redis";
import prisma from "../../../packages/libs/primsa";


const producer = kafka.producer();


const connectedUsers: Map<string, WebSocket> = new Map();
const unseenCounts: Map<string, number> = new Map();

const PRESENCE_TTL_SECONDS = 300;
// Comfortably inside the TTL, so a slow tick can never let the key lapse.
const PRESENCE_REFRESH_MS = 120_000;

/**
 * `registeredUserId` arrives as `user_<id>` or `seller_<id>`.
 *
 * The two sides are keyed asymmetrically and the readers depend on it: sellers
 * drop the prefix (`online:seller:<id>`) while users keep it
 * (`online:user:user_<id>`). Both shapes are mirrored in chatting.controller.ts.
 */
const presenceKeyFor = (registeredUserId: string) =>
    registeredUserId.startsWith("seller_")
        ? `online:seller:${registeredUserId.replace("seller_", "")}`
        : `online:user:${registeredUserId}`;

const rawIdOf = (registeredUserId: string) =>
    registeredUserId.replace(/^(user|seller)_/, "");

/**
 * Tells the people this account is in a conversation with that it just came
 * online or went offline.
 *
 * Presence was previously only ever read once, when the conversation list was
 * fetched over HTTP — so a counterpart who connected afterwards stayed "Offline"
 * on screen for the whole session.
 */
async function broadcastPresence(registeredUserId: string, isOnline: boolean) {
    const rawId = rawIdOf(registeredUserId);

    const groups = await prisma.conversationGroup.findMany({
        where: { participantIds: { has: rawId } },
        select: { participantIds: true },
    });

    const event = JSON.stringify({
        type: "PRESENCE_UPDATE",
        payload: { userId: rawId, isOnline },
    });

    const alreadySent = new Set<string>();

    for (const group of groups) {
        for (const participantId of group.participantIds) {
            if (participantId === rawId) continue;

            // A participant id says nothing about which side it belongs to, so try
            // both registration keys and use whichever one is actually connected.
            for (const key of [`user_${participantId}`, `seller_${participantId}`]) {
                if (alreadySent.has(key)) continue;
                const socket = connectedUsers.get(key);
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(event);
                    alreadySent.add(key);
                }
            }
        }
    }
}

type IncomingMessage = {
    type?: string;
    fromUserId: string;
    // camelCase, matching what the client actually sends. This was `ToUserId`,
    // so every real message failed the required-field check below and was
    // dropped with "Invalid message received".
    toUserId: string;
    messageBody: string;
    conversationId: string;
    senderType: string;
}

export async function createWebSocketServer(server: HttpServer) {

    const wss = new WebSocketServer({ server });

    await producer.connect();

    console.log("kafka producer connected");

    wss.on('connection',(ws:WebSocket) =>{
        console.log("new websocket connection established");
        let registeredUserId: string | null = null;
        let presenceTimer: NodeJS.Timeout | null = null;

        ws.on("message",async (rawMessage: string) => {
            try{

                const messageStr = rawMessage.toString();
                //Register the user on first plain message (non-JSON message)
                if(!registeredUserId && !messageStr.startsWith("{")){

                    registeredUserId = messageStr;
                    connectedUsers.set(registeredUserId, ws);
                    console.log(`User ${registeredUserId} registered with websocket connection`);

                    const redisKey = presenceKeyFor(registeredUserId);
                    await redis.set(redisKey, "1", "EX", PRESENCE_TTL_SECONDS);

                    /*
                      The TTL exists so a presence key can't outlive a process that
                      died without running its close handler — but nothing renewed
                      it, so anyone with a socket open longer than five minutes
                      silently went "offline" while still connected.
                    */
                    presenceTimer = setInterval(() => {
                        redis
                            .set(redisKey, "1", "EX", PRESENCE_TTL_SECONDS)
                            .catch((err) => console.error("Presence refresh failed:", err));
                    }, PRESENCE_REFRESH_MS);

                    await broadcastPresence(registeredUserId, true);
                    return;

                }
                //process the json message

                const data: IncomingMessage = JSON.parse(messageStr);

                //if it is seen update
                if(data.type === "MARK_AS_SEEN" && registeredUserId) {

                    const seenKey = `${registeredUserId}_${data.conversationId}`;
                    unseenCounts.set(seenKey, 0);
                    return;
                }

                //regular message
                const {fromUserId, toUserId, messageBody, conversationId, senderType} = data;
                if(!fromUserId || !toUserId || !messageBody || !conversationId || !senderType) {
                    console.warn("Invalid message received:", data);
                    return;
                }

                const now = new Date().toISOString();

                const messagePayload = {
                    conversationId,
                    senderId: fromUserId,
                    senderType,
                    content: messageBody,
                    createdAt: now,
                }


                const messageEvent = JSON.stringify({
                    type: "NEW_MESSAGE",
                    payload: messagePayload
                });

                const receiverKey = senderType === "user" ? `seller_${toUserId}` : `user_${toUserId}`;
                const senderKey = senderType === "user" ? `user_${fromUserId}` : `seller_${fromUserId}`;

                //update unseen count for the receive dynamically

                const unseenKey = `${receiverKey}_${conversationId}`;
                const prevCount = unseenCounts.get(unseenKey) || 0;
                unseenCounts.set(unseenKey, prevCount + 1);

                //send new message event to the receiver if they are connected

                const receiverSocket = connectedUsers.get(receiverKey);
                if(receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
                    receiverSocket.send(messageEvent);

                    //send unseen count update to the receiver  

                    receiverSocket.send(JSON.stringify({
                    type: "UNSEEN_COUNT_UPDATE",
                    payload: {
                        conversationId,
                        count: prevCount + 1
                    }
                }));
                    console.log(`Sent message to ${receiverKey} and updated unseen count to ${prevCount + 1}`);
                }else{
                    console.log(`Receiver ${receiverKey} is not connected. Message will be sent when they connect.`);
                }

                //echo to sender

                const senderSocket = connectedUsers.get(senderKey);
                if(senderSocket && senderSocket.readyState === WebSocket.OPEN) {
                    senderSocket.send(messageEvent);
                    console.log(`Echoed message back to sender ${senderKey}`);

                }

                await producer.send({
                    topic: "chat.new_message",
                    messages:[{
                        key: conversationId,
                        value: JSON.stringify(messagePayload)
                    }]
                });
                console.log(`Message sent to Kafka topic 'chat.new_message' for conversation ${conversationId}`);


            }
            catch (error) {
                console.error("Error handling websocket message:", error);
            }
        });

        ws.on("close",async() => {
            if(presenceTimer) {
                clearInterval(presenceTimer);
                presenceTimer = null;
            }

            if(registeredUserId) {
                /*
                  Only tear down presence if THIS socket is still the registered one.
                  A second tab registers under the same key and overwrites the entry;
                  without this check, closing the older tab would mark the account
                  offline while the newer tab is still connected.
                */
                if(connectedUsers.get(registeredUserId) !== ws) {
                    console.log(`Stale socket for ${registeredUserId} closed; presence left intact`);
                    return;
                }

                connectedUsers.delete(registeredUserId);
                console.log(`User ${registeredUserId} disconnected and removed from connected users`);

                await redis.del(presenceKeyFor(registeredUserId));
                console.log(`Removed online status for ${registeredUserId} from Redis`);

                await broadcastPresence(registeredUserId, false);
            }
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });

        console.log("WebSocket server is running and ready to accept connections");
    });
}