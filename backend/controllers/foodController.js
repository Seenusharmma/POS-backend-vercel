import Food from "../models/foodModel.js";
import { v2 as cloudinary } from "cloudinary";

/* ================================
   🥗 GET - All Foods
================================ */
export const getFoods = async (req, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });
    res.status(200).json(foods);
  } catch (error) {
    console.error("❌ Error fetching foods:", error);
    res.status(500).json({ message: "Failed to fetch foods" });
  }
};

/* ================================
   🍕 POST - Add New Food
================================ */
export const addFood = async (req, res) => {
  try {
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

    const io = req.app.get("io");
    if (io) io.emit("newFoodAdded", food);

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

    const io = req.app.get("io");
    if (io) io.emit("foodUpdated", food);

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

    const io = req.app.get("io");
    if (io) io.emit("foodDeleted", id);

    res.status(200).json({ message: "✅ Food deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting food:", error);
    res.status(500).json({ message: "Failed to delete food" });
  }
};
