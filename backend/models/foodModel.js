import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    type: String,
    price: Number,
    image: String, // now stores full ImageKit URL
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Food", foodSchema);
