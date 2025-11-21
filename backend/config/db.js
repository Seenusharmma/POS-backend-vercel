import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Cache the connection to avoid multiple connections in serverless
let cachedConnection = null;

export const connectDB = async () => {
  try {
    // If connection already exists and is connected, return it
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log("✅ Using existing MongoDB connection");
      return cachedConnection;
    }

    let mongoUri = process.env.MONGODB_URI || "mongodb+srv://roshansharma7250:v5xmJvpbsxEYW1ek@cluster0.l4oud1b.mongodb.net/";
    
    if (!mongoUri) {
      throw new Error("MongoDB URI is not defined. Please set MONGODB_URI in your .env file");
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
    
    console.log("🔗 Connecting to MongoDB...");

    // Set Mongoose-specific options globally (before connecting)
    mongoose.set("bufferCommands", false); // Disable mongoose buffering globally
    
    // Connection options optimized for serverless (Vercel)
    // Note: retryWrites and w should be in URI, not options
    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 10000, // Connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
    };

    // If connection exists but is not connected, close it first
    if (mongoose.connection.readyState !== 0 && mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connection.close();
      } catch (closeErr) {
        console.warn("⚠️ Error closing existing connection:", closeErr.message);
      }
    }

    // Connect to MongoDB
    cachedConnection = await mongoose.connect(mongoUri, options);
    
    // Wait a moment to ensure connection is fully established
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Connection established but not ready. ReadyState: ${mongoose.connection.readyState}`);
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
    console.error("❌ DB Connection Failed:", err.message);
    console.error("Connection error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    cachedConnection = null;
    
    // In serverless, we still want to know about connection failures
    // but we'll let routes handle retries
    // Return null to indicate failure, but don't throw
    return null;
  }
};


