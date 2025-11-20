import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true, // linked to logged-in Firebase user
    },
    userName: {
      type: String,
      default: "Guest User", // Username from Firebase displayName
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "Uncategorized",
    },
    type: {
      type: String,
      enum: ["Veg", "Non-Veg", "Other"],
      default: "Veg",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Cooking", "Ready", "Served", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true } // ✅ adds createdAt & updatedAt automatically
);

export default mongoose.model("Order", orderSchema);
