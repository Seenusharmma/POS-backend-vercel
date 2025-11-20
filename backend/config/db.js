import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://roshansharma7250:v5xmJvpbsxEYW1ek@cluster0.l4oud1b.mongodb.net/";
    
    if (!mongoUri) {
      throw new Error("MongoDB URI is not defined. Please set MONGODB_URI in your .env file");
    }

    await mongoose.connect(mongoUri);
    
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
    throw err; // Re-throw to allow server to handle the error
  }
};


