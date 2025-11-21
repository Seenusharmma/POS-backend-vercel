import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Food from "../models/foodModel.js";
import mongoose from "mongoose";

const router = express.Router();

// ✅ Memory storage (no local files)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================================
   🥗 GET - All Foods
================================ */
router.get("/", async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    const { connectDB } = await import("../config/db.js");
    
    // Check connection state and connect if needed (with retry)
    let retries = 0;
    const maxRetries = 2;
    
    while (mongoose.connection.readyState !== 1 && retries < maxRetries) {
      console.log(`🔄 Establishing database connection... (Attempt ${retries + 1}/${maxRetries})`);
      const connectionResult = await connectDB();
      
      // Wait a bit before checking connection state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (mongoose.connection.readyState === 1) {
        console.log("✅ Database connection established");
        break;
      }
      
      retries++;
      
      if (retries >= maxRetries) {
        console.error("❌ Database connection failed after retries");
        return res.status(503).json({ 
          success: false, 
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    // Verify connection is ready before querying
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ Database not connected. ReadyState:", mongoose.connection.readyState);
      return res.status(503).json({ 
        success: false, 
        message: "Database connection unavailable. Please try again later." 
      });
    }

    // Query foods
    const foods = await Food.find().sort({ createdAt: -1 });
    console.log(`✅ Fetched ${foods.length} foods successfully`);
    res.status(200).json(foods);
  } catch (err) {
    console.error("❌ Error fetching foods:", err);
    // Provide more detailed error information
    const errorMessage = err.message || "Unknown error";
    const errorName = err.name || "Error";
    
    console.error("Error details:", {
      message: errorMessage,
      name: errorName,
      stack: err.stack,
      readyState: mongoose.connection.readyState
    });
    
    // Check if it's a database connection error
    if (errorName === "MongoServerSelectionError" || errorMessage.includes("connection")) {
      return res.status(503).json({ 
        success: false, 
        message: "Database connection error. Please try again later.",
        error: process.env.NODE_ENV === "development" ? errorMessage : undefined
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch foods",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
});

/* ================================
   🍔 GET - Single Food by ID
================================ */
router.get("/:id", async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    const { connectDB } = await import("../config/db.js");
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for get single food...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false, 
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const food = await Food.findById(req.params.id);
    if (!food)
      return res.status(404).json({ success: false, message: "Food not found" });
    res.status(200).json(food);
  } catch (err) {
    console.error("❌ Error fetching single food:", err);
    
    // Check if it's a database connection error
    if (err.name === "MongoServerSelectionError" || err.message.includes("connection")) {
      return res.status(503).json({ 
        success: false, 
        message: "Database connection error. Please try again later.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch food",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

/* ================================
   🍕 POST - Add New Food
================================ */
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    const { connectDB } = await import("../config/db.js");
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for add food...");
      await connectDB();
    }

    // ✅ Validation
    const { name, category, type, price } = req.body;
    
    if (!name || !category || !type || !price) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, category, type, and price",
      });
    }

    const validTypes = ["Veg", "Non-Veg", "Other"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be one of: Veg, Non-Veg, Other",
      });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

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
      price: priceNum,
      image: imageUrl,
      available: req.body.available !== "false" && req.body.available !== false,
    });

    await food.save();

    // ✅ Emit socket event for real-time updates to all users
    const io = req.app.get("io");
    if (io && typeof io.emit === "function") {
      io.emit("newFoodAdded", food);
      console.log("➕ Emitted newFoodAdded event for food:", food._id);
    }

    res.status(201).json({
      success: true,
      message: "Food added successfully!",
      food,
    });
  } catch (err) {
    console.error("❌ Error adding food:", err);
    res.status(500).json({ success: false, message: "Failed to add food" });
  }
});

/* ================================
   ✏️ PUT - Update Food
================================ */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    const { connectDB } = await import("../config/db.js");
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for update food...");
      await connectDB();
    }

    const { id } = req.params;
    let updateData = { ...req.body };

    // ✅ Validation for type if provided
    if (updateData.type) {
      const validTypes = ["Veg", "Non-Veg", "Other"];
      if (!validTypes.includes(updateData.type)) {
        return res.status(400).json({
          success: false,
          message: "Type must be one of: Veg, Non-Veg, Other",
        });
      }
    }

    // ✅ Validation for price if provided
    if (updateData.price !== undefined) {
      const priceNum = Number(updateData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a positive number",
        });
      }
      updateData.price = priceNum;
    }

    // ✅ Trim string fields
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.category) updateData.category = updateData.category.trim();

    // ✅ Upload new image if provided
    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(base64, {
        folder: "tastebite_foods",
        resource_type: "auto",
      });
      updateData.image = uploadResponse.secure_url;
      console.log("✅ Updated image uploaded:", updateData.image);
    }

    const updatedFood = await Food.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedFood)
      return res.status(404).json({ success: false, message: "Food not found" });

    // ✅ Emit socket event for real-time updates to all users
    const io = req.app.get("io");
    if (io && typeof io.emit === "function") {
      io.emit("foodUpdated", updatedFood);
      console.log("🍽️ Emitted foodUpdated event for food:", updatedFood._id, "Available:", updatedFood.available);
    }

    res.status(200).json({
      success: true,
      message: "Food updated successfully",
      food: updatedFood,
    });
  } catch (err) {
    console.error("❌ Error updating food:", err);
    res.status(500).json({ success: false, message: "Failed to update food" });
  }
});

/* ================================
   🗑️ DELETE - Remove Food
================================ */
router.delete("/:id", async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    const { connectDB } = await import("../config/db.js");
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for delete food...");
      await connectDB();
    }

    const { id } = req.params;
    console.log("🗑️ DELETE request for food:", id); // ✅ Helpful for Render logs

    const food = await Food.findById(id);
    if (!food) {
      console.log("❌ Food not found in DB");
      return res.status(404).json({ success: false, message: "Food not found" });
    }

    // ✅ Delete Cloudinary image if exists
    if (food.image) {
      try {
        const publicId = food.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`tastebite_foods/${publicId}`);
        console.log(`🗑️ Deleted Cloudinary image: ${publicId}`);
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

    res.status(200).json({
      success: true,
      message: "Food deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting food:", err);
    res.status(500).json({ success: false, message: "Failed to delete food" });
  }
});

export default router;
