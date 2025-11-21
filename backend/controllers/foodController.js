import Food from "../models/foodModel.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

/* ================================
   🥗 GET - All Foods
================================ */
export const getFoods = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for getFoods...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false,
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const foods = await Food.find().sort({ createdAt: -1 });
    res.status(200).json(foods);
  } catch (error) {
    console.error("❌ Error fetching foods:", error);
    
    // Check if it's a database connection error
    if (error.name === "MongoServerSelectionError" || error.message.includes("connection")) {
      return res.status(503).json({ 
        success: false,
        message: "Database connection error. Please try again later.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch foods",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/* ================================
   🍕 POST - Add New Food
================================ */
export const addFood = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for addFood...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false,
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const { name, category, type, price, available } = req.body;
    let imageUrl = null;

    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(base64, {
        folder: "tastebite_foods",
        resource_type: "auto",
      });
      imageUrl = uploadResponse.secure_url;
      console.log("✅ Uploaded to Cloudinary:", imageUrl);
    }

    const food = new Food({
      name: name.trim(),
      category: category.trim(),
      type,
      price: Number(price),
      available: available !== "false" && available !== false,
      image: imageUrl,
    });

    await food.save();

    // ✅ Emit socket event for real-time updates to all users
    const io = req.app.get("io");
    if (io && typeof io.emit === "function") {
      io.emit("newFoodAdded", food);
      console.log("➕ Emitted newFoodAdded event for food:", food._id);
    }

    res.status(201).json({ message: "✅ Food added successfully", food });
  } catch (error) {
    console.error("❌ Error adding food:", error);
    res.status(500).json({ message: "Failed to add food" });
  }
};

/* ================================
   ✏️ PUT - Update Food
================================ */
export const updateFood = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for updateFood...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false,
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // ✅ Handle image replacement if uploaded
    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(base64, {
        folder: "tastebite_foods",
        resource_type: "auto",
      });
      updateData.image = uploadResponse.secure_url;
      console.log("✅ Updated Cloudinary image:", updateData.image);
    }

    // ✅ Numeric and string normalization
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.category) updateData.category = updateData.category.trim();

    const food = await Food.findByIdAndUpdate(id, updateData, { new: true });
    if (!food) return res.status(404).json({ message: "Food not found" });

    // ✅ Emit socket event for real-time updates to all users
    const io = req.app.get("io");
    if (io && typeof io.emit === "function") {
      io.emit("foodUpdated", food);
      console.log("🍽️ Emitted foodUpdated event for food:", food._id, "Available:", food.available);
    }

    res.status(200).json({ message: "✅ Food updated successfully", food });
  } catch (error) {
    console.error("❌ Error updating food:", error);
    res.status(500).json({ message: "Failed to update food" });
  }
};

/* ================================
   🗑️ DELETE - Remove Food
================================ */
export const deleteFood = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for deleteFood...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false,
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const { id } = req.params;
    console.log("🗑️ DELETE request for food:", id);

    const food = await Food.findById(id);
    if (!food) {
      console.log("❌ Food not found in database");
      return res.status(404).json({ message: "Food not found" });
    }

    // ✅ Delete Cloudinary image (if exists)
    if (food.image && food.image.includes("cloudinary")) {
      try {
        const publicId = food.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`tastebite_foods/${publicId}`);
        console.log(`🧹 Deleted Cloudinary image: ${publicId}`);
      } catch (error) {
        console.warn("⚠️ Could not delete Cloudinary image:", error.message);
      }
    }

    await food.deleteOne();

    // ✅ Emit socket event for real-time updates to all users
    const io = req.app.get("io");
    if (io && typeof io.emit === "function") {
      io.emit("foodDeleted", id);
      console.log("🗑️ Emitted foodDeleted event for food:", id);
    }

    res.status(200).json({ message: "✅ Food deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting food:", error);
    res.status(500).json({ message: "Failed to delete food" });
  }
};
