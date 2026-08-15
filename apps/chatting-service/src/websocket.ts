import {kafka} from "../../../packages/utils/kafka";
import {WebSocket, WebSocketServer} from "ws";
import  { Server as HttpServer} from "http";
import redis from "../../../packages/libs/redis";


const producer = kafka.producer();


const connectedUsers: Map<string, WebSocket> = new Map();
const unseenCounts: Map<string, number> = new Map();

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

        ws.on("message",async (rawMessage: string) => {
            try{

                const messageStr = rawMessage.toString();
                //Register the user on first plain message (non-JSON message)
                if(!registeredUserId && !messageStr.startsWith("{")){

                    registeredUserId = messageStr;
                    connectedUsers.set(registeredUserId, ws);
                    console.log(`User ${registeredUserId} registered with websocket connection`);

                    const isSeller = registeredUserId.startsWith("seller_");
                    const redisKey = isSeller ? `online:seller:${registeredUserId.replace("seller_", "")}` : `online:user:${registeredUserId}`;
                    await redis.set(redisKey,"1");
                    await redis.expire(redisKey, 300 ); // Set expiration to 5 minutes
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
            if(registeredUserId) {
                connectedUsers.delete(registeredUserId);
                console.log(`User ${registeredUserId} disconnected and removed from connected users`);

                const isSeller = registeredUserId.startsWith("seller_");
                const redisKey = isSeller ? `online:seller:${registeredUserId.replace("seller_", "")}` : `online:user:${registeredUserId}`;
                await redis.del(redisKey);
                console.log(`Removed online status for ${registeredUserId} from Redis`);
            }
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });

        console.log("WebSocket server is running and ready to accept connections");
    });
}