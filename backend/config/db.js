import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Global cache to persist connections across serverless function calls
let globalCache = global.mongooseCache || {
  primary: { conn: null, promise: null },
  secondary: { conn: null, promise: null }
};

global.mongooseCache = globalCache;

// ---------------------------------------------
// 🚀 PRIMARY DB CONNECTION
// ---------------------------------------------
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("❌ Missing MONGODB_URI environment variable");

  // If already connected → return instantly (fast)
  if (globalCache.primary.conn) return globalCache.primary.conn;

  // If a connection promise is already running, await it
  if (!globalCache.primary.promise) {
    console.log("🔗 Connecting to PRIMARY MongoDB...");

    const options = {
      // ⚡ Optimized for serverless and local development
      maxPoolSize: 10,              // Reduced for serverless - Vercel function limits
      minPoolSize: 2,               // Minimal connections for serverless
      maxIdleTimeMS: 60000,         // Keep idle connections for 60s
      waitQueueTimeoutMS: 10000,    // Max wait time for available connection
      
      // ⚡ Performance tuning
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 60000,       // 60s for long queries
      connectTimeoutMS: 10000,      // Connection establishment timeout
      
      // ⚡ Reliability
      retryWrites: true,
      retryReads: true,
      w: 'majority',                // Write concern for data durability
      
      // ⚡ Network optimization
      family: 4,                    // IPv4 for better compatibility
      compressors: ['zlib'],        // Compress data transfer
      zlibCompressionLevel: 6       // Balance between speed and compression
    };

    globalCache.primary.promise = mongoose.connect(uri, options)
      .then((mongoose) => {
        console.log("✅ PRIMARY MongoDB Connected");
        
        // ⚡ Monitor critical connection events only
        const connection = mongoose.connection;
        
        // Track only critical connection events (errors and closures)
        connection.on('error', (err) => {
          console.error(`❌ MongoDB connection error: ${err.message}`);
        });
        
        connection.on('disconnected', () => {
          console.warn('⚠️ MongoDB disconnected');
        });
        
        return mongoose.connection;
      })
      .catch((err) => {
        console.error("❌ PRIMARY MongoDB connection error:", err.message);
        globalCache.primary.promise = null; // allow retry on next call
        throw err;
      });
  }

  globalCache.primary.conn = await globalCache.primary.promise;
  return globalCache.primary.conn;
};


// ---------------------------------------------
// 🚀 SECONDARY DB CONNECTION (optional)
// ---------------------------------------------
export const connectSecondaryDB = async () => {
  const secondaryUri = process.env.SECONDARY_DB_URI;

  if (!secondaryUri) {
    console.warn("⚠️ No SECONDARY_DB_URI provided. Skipping secondary DB.");
    return null;
  }

  if (globalCache.secondary.conn) return globalCache.secondary.conn;

  if (!globalCache.secondary.promise) {
    console.log("🔗 Connecting to SECONDARY MongoDB...");

    const conn = mongoose.createConnection();

    globalCache.secondary.promise = conn
      .openUri(secondaryUri, {
        maxPoolSize: 5,
        retryWrites: true,
        retryReads: true,
        serverSelectionTimeoutMS: 4000
      })
      .then(() => {
        console.log("✅ SECONDARY MongoDB Connected");
        return conn;
      })
      .catch((err) => {
        console.error("❌ Secondary DB Error:", err.message);
        globalCache.secondary.promise = null;
        return null; // don't crash the app
      });
  }

  globalCache.secondary.conn = await globalCache.secondary.promise;
  return globalCache.secondary.conn;
};

export default connectDB;
