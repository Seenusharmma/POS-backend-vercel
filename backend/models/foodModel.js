import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    type: String,
    price: Number,
    image: String, // now stores full ImageKit URL
    available: { type: Boolean, default: true },
    // Size options (optional - only for foods that have sizes)
    hasSizes: { type: Boolean, default: false },
    sizeType: {
      type: String,
      enum: ["standard", "half-full", null],
      default: null,
    },
    sizes: {
      Small: { type: Number, default: null },
      Medium: { type: Number, default: null },
      Large: { type: Number, default: null },
    },
    halfFull: {
      Half: { type: Number, default: null },
      Full: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

// ⚡ Indexes for performance
foodSchema.index({ category: 1 });
foodSchema.index({ type: 1 });
foodSchema.index({ available: 1 });
foodSchema.index({ createdAt: -1 });

export default mongoose.model("Food", foodSchema);
