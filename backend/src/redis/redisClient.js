// redis/redisClient.js
import { createClient } from "redis";

const useRedis = process.env.USE_REDIS === "true";

let redisClient = null;

if (useRedis) {
  redisClient = createClient({
    // url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  (async () => {
    try {
      await redisClient.connect();
      console.log("✅ Redis connected");
    } catch (err) {
      console.error("❌ Redis connect failed:", err.message);
      redisClient = null; // disable Redis usage if connection fails
    }
  })();
}

export default redisClient;
