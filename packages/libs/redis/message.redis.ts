import redis from ".";

export const incrementUnseenCount = async(receiverType: "user" | "seller", conversationId: string) => {

    const key = `unseen:${receiverType}_${conversationId}`;
    await redis.incr(key);
};

export const getUnseenCount = async(receiverType: "user" | "seller", conversationId: string): Promise<number> => {

    const key = `unseen:${receiverType}_${conversationId}`;
    const count = await redis.get(key);
    return count ? parseInt(count, 10) : 0;
};

export const clearUnseenCount = async(receiverType: "user" | "seller", conversationId: string) => {

    const key = `unseen:${receiverType}_${conversationId}`;
    await redis.del(key);
};