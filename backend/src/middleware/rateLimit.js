// src/middleware/rateLimit.js
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../redis/redisClient.js";

// Only create RedisStore if redisClient exists
const store =
  redisClient &&
  new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later",
  ...(store ? { store } : {}), // use Redis store only when available
});

export { loginLimiter };
