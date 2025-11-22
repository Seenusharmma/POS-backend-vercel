import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  foodId: {
    type: String,
    required: true,
    trim: true,
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
  image: {
    type: String,
    default: "",
  },
});

const cartSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      unique: true, // One cart per user
      index: true, // For faster queries
    },
    userId: {
      type: String,
      default: "",
    },
    userName: {
      type: String,
      default: "Guest User",
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

export default mongoose.model("Cart", cartSchema);

