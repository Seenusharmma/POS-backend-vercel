import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

// Create Redis client
let redisClient = null;

// Initialize Redis connection
export const connectRedis = async () => {
  try {
    if (redisClient && redisClient.status === "ready") {
      console.log("✅ Using existing Redis connection");
      return redisClient;
    }

    redisClient = new Redis(redisConfig);

    redisClient.on("connect", () => {
      console.log("🔗 Connecting to Redis...");
    });

    redisClient.on("ready", () => {
      console.log("✅ Redis Connected Successfully");
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis connection error:", err.message);
      // Don't throw - allow app to continue without Redis
    });

    redisClient.on("close", () => {
      console.warn("⚠️ Redis connection closed");
    });

    redisClient.on("reconnecting", () => {
      console.log("🔄 Redis reconnecting...");
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error.message);
    console.warn("⚠️ App will continue without Redis caching");
    // Return null to indicate Redis is unavailable
    return null;
  }
};

// Get Redis client (returns null if not connected)
export const getRedisClient = () => {
  if (redisClient && redisClient.status === "ready") {
    return redisClient;
  }
  return null;
};

// Check if Redis is available
export const isRedisAvailable = () => {
  const client = getRedisClient();
  return client !== null && client.status === "ready";
};

// Graceful shutdown
export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log("✅ Redis connection closed");
    } catch (error) {
      console.error("❌ Error closing Redis connection:", error);
    }
  }
};

export default redisClient;

