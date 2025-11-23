import { getRedisClient, isRedisAvailable } from "../config/redis.js";

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  FOODS: 300, // 5 minutes
  ORDERS: 60, // 1 minute (orders change frequently)
  CART: 300, // 5 minutes
  ADMIN: 300, // 5 minutes
};

// Cache key prefixes
const CACHE_KEYS = {
  FOODS: "foods:all",
  FOOD: "food:",
  ORDERS: "orders:all",
  ORDER: "order:",
  CART: "cart:",
  ADMINS: "admins:all",
  ADMIN: "admin:",
};

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached data or null
 */
export const getCache = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return null;
    }

    const client = getRedisClient();
    const data = await client.get(key);

    if (data) {
      return JSON.parse(data);
    }

    return null;
  } catch (error) {
    console.error(`❌ Error getting cache for key ${key}:`, error.message);
    return null;
  }
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - Success status
 */
export const setCache = async (key, data, ttl = 300) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }

    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`❌ Error setting cache for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete cached data
 * @param {string} key - Cache key or pattern
 * @returns {Promise<boolean>} - Success status
 */
export const deleteCache = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }

    const client = getRedisClient();

    // Check if key contains wildcard
    if (key.includes("*")) {
      // Delete all keys matching pattern
      const keys = await client.keys(key);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } else {
      await client.del(key);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error deleting cache for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Cache middleware for GET requests
 * @param {string} cacheKey - Cache key
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} - Express middleware
 */
export const cacheMiddleware = (cacheKey, ttl = 300) => {
  return async (req, res, next) => {
    try {
      // Only cache GET requests
      if (req.method !== "GET") {
        return next();
      }

      // Try to get from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData !== null) {
        console.log(`✅ Cache HIT for key: ${cacheKey}`);
        return res.status(200).json(cachedData);
      }

      // Cache miss - continue to controller
      console.log(`❌ Cache MISS for key: ${cacheKey}`);
      next();
    } catch (error) {
      console.error("❌ Cache middleware error:", error);
      next();
    }
  };
};

/**
 * Invalidate cache after data modification
 * @param {string|string[]} keys - Cache key(s) to invalidate
 */
export const invalidateCache = async (keys) => {
  try {
    if (!isRedisAvailable()) {
      return;
    }

    const keysArray = Array.isArray(keys) ? keys : [keys];

    for (const key of keysArray) {
      await deleteCache(key);
      console.log(`🗑️ Cache invalidated: ${key}`);
    }
  } catch (error) {
    console.error("❌ Error invalidating cache:", error);
  }
};

// Export cache keys and TTL for use in controllers
export { CACHE_KEYS, CACHE_TTL };

