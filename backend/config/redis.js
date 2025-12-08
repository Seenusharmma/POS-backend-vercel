import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Redis connection configuration
const MAX_RETRY_ATTEMPTS = 5; // Stop retrying after 5 attempts

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    // Stop retrying after MAX_RETRY_ATTEMPTS
    if (times > MAX_RETRY_ATTEMPTS) {
      console.warn(`⚠️ Redis: Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Stopping reconnection.`);
      console.warn("⚠️ App will continue without Redis caching. Please start Redis server to enable caching.");
      return null; // Return null to stop retrying
    }
    // Increased delay for better stability
    const delay = Math.min(times * 100, 3000); // Increased from 50ms to 100ms, max 3s instead of 2s
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  enableOfflineQueue: false, // Don't queue commands when disconnected - fail fast instead
  connectTimeout: 10000,     // 10s connection timeout
  keepAlive: 30000,          // Send keep-alive packets every 30s
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
      // Only log non-connection-refused errors to reduce noise
      const errorMsg = err?.message || err?.toString() || "Unknown error";
      if (!errorMsg.includes("ECONNREFUSED") && !errorMsg.includes("connect ETIMEDOUT")) {
        console.error("❌ Redis connection error:", errorMsg);
      }
      // Don't throw - allow app to continue without Redis
    });

    redisClient.on("close", () => {
      // Only log if not intentionally closed
      if (redisClient && redisClient.status !== "end") {
        console.warn("⚠️ Redis connection closed");
      }
    });

    let reconnectCount = 0;
    redisClient.on("reconnecting", (delay) => {
      reconnectCount++;
      // Only log first 3 reconnection attempts to reduce spam
      if (reconnectCount <= 3) {
        console.log(`🔄 Redis reconnecting... (attempt ${reconnectCount}/${MAX_RETRY_ATTEMPTS})`);
      }
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

