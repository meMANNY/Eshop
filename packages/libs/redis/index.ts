import Redis from "ioredis";
console.log("REDIS_URL", process.env.REDIS_URL);
const redis = new Redis(process.env.REDIS_URL!);

export default redis;