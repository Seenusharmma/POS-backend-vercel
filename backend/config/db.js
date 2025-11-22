import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Cache the connection to avoid multiple connections in serverless
let cachedConnection = null;

export const connectDB = async (retryCount = 0, maxRetries = 3) => {
  try {
    // If connection already exists and is connected, return it
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log("✅ Using existing MongoDB connection");
      return cachedConnection;
    }

    let mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error("MongoDB URI is not defined. Please set MONGODB_URI in your environment variables");
    }

    // Ensure MongoDB URI has database name and proper query parameters
    // If URI ends with /, add database name or ensure it has query params
    if (mongoUri.endsWith("/")) {
      mongoUri = mongoUri.slice(0, -1); // Remove trailing slash
    }
    
    // Add query parameters if not present
    if (!mongoUri.includes("?")) {
      mongoUri += "?retryWrites=true&w=majority";
    } else if (!mongoUri.includes("retryWrites")) {
      mongoUri += "&retryWrites=true&w=majority";
    }
    
    console.log(`🔗 Connecting to MongoDB... (Attempt ${retryCount + 1}/${maxRetries + 1})`);

    // Set Mongoose-specific options globally (before connecting)
    mongoose.set("bufferCommands", false); // Disable mongoose buffering globally
    
    // Connection options optimized for serverless (Vercel) with better error handling
    // Note: retryWrites and w should be in URI, not options
    const options = {
      serverSelectionTimeoutMS: 30000, // Increased timeout (30s) for better reliability
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 30000, // Increased connection timeout (30s)
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      // ✅ Add retry options
      retryWrites: true,
      retryReads: true,
      // ✅ Better DNS handling
      directConnection: false, // Use SRV records for MongoDB Atlas
      // ✅ Family preference for IPv4/IPv6
      family: 4, // Prefer IPv4 to avoid DNS resolution issues
    };

    // If connection exists but is not connected, close it first
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState === 2) {
      // Connection is in progress, wait for it
      console.log("⏳ Connection in progress, waiting...");
      await new Promise((resolve) => {
        const checkConnection = () => {
          if (mongoose.connection.readyState === 1) {
            console.log("✅ Connection completed");
            resolve();
          } else if (mongoose.connection.readyState !== 2) {
            resolve();
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
      
      if (mongoose.connection.readyState === 1) {
        cachedConnection = mongoose.connection;
        return cachedConnection;
      }
    }
    
    if (mongoose.connection.readyState !== 0 && mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connection.close();
      } catch (closeErr) {
        console.warn("⚠️ Error closing existing connection:", closeErr.message);
      }
    }

    // Connect to MongoDB
    cachedConnection = await mongoose.connect(mongoUri, options);
    
    // Wait a bit longer to ensure connection is fully established (especially for serverless)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      // Try one more time after a short delay
      await new Promise(resolve => setTimeout(resolve, 500));
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`Connection established but not ready. ReadyState: ${mongoose.connection.readyState}`);
      }
    }
    
    console.log("✅ MongoDB Connected Successfully. ReadyState:", mongoose.connection.readyState);
    
    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
      cachedConnection = null;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
      cachedConnection = null;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });

    return cachedConnection;
  } catch (err) {
    const errorMessage = err.message || "Unknown error";
    const errorCode = err.code || "UNKNOWN";
    const errorName = err.name || "Error";
    
    console.error(`❌ MongoDB connection error: ${errorName} - ${errorMessage}`);
    
    // ✅ Detailed error information for debugging
    if (errorCode === "ECONNREFUSED" || errorMessage.includes("ECONNREFUSED")) {
      console.error("⚠️  Connection Refused - Possible causes:");
      console.error("   1. MongoDB Atlas cluster might be paused");
      console.error("   2. IP address not whitelisted in MongoDB Atlas");
      console.error("   3. Network/firewall blocking connection");
      console.error("   4. DNS resolution issues");
      console.error("   💡 Check MongoDB Atlas Dashboard → Network Access");
    } else if (errorCode === "ETIMEDOUT" || errorMessage.includes("timeout")) {
      console.error("⚠️  Connection Timeout - Network may be slow or unreachable");
    } else if (errorCode === "ENOTFOUND" || errorMessage.includes("ENOTFOUND")) {
      console.error("⚠️  DNS Resolution Failed - Check your internet connection");
    }
    
    console.error("Connection error details:", {
      name: errorName,
      code: errorCode,
      message: errorMessage,
    });
    
    cachedConnection = null;
    
    // ✅ Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
      console.log(`🔄 Retrying connection in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(retryCount + 1, maxRetries);
    }
    
    console.error(`❌ Database not connected after ${maxRetries + 1} retries. ReadyState: ${mongoose.connection.readyState}`);
    
    // In serverless, we still want to know about connection failures
    // but we'll let routes handle retries
    // Return null to indicate failure, but don't throw
    return null;
  }
};


