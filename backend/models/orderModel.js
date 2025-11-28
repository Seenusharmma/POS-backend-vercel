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
    selectedSize: {
      type: String,
      enum: ["Small", "Medium", "Large", "Half", "Full"],
      default: null,
      required: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Cooking", "Ready", "Served", "Completed"],
      default: "Pending",
    },
    userId: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    isInRestaurant: {
      type: Boolean,
      default: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    chairsBooked: {
      type: Number,
      default: 0,
      min: 0,
      max: 4, // TABLE OPTIONS: Maximum 4 chairs per table
    },
    chairIndices: {
      type: [Number], // Array of chair indices (0-3) for dine-in orders
      default: [],
      validate: {
        validator: function(v) {
          // TABLE OPTIONS: Each index must be between 0-3 (4 chairs per table)
          return v.every(idx => idx >= 0 && idx <= 3);
        },
        message: 'Chair indices must be between 0 and 3'
      }
    },
    chairLetters: {
      type: String,
      trim: true,
      default: "", // Chair letters (a, b, c, d) for display, space-separated
    },
    tables: [
      {
        tableNumber: { type: Number, required: true },
        chairIndices: { type: [Number], default: [] },
        chairLetters: { type: String, default: "" }
      }
    ],
    deliveryLocation: {
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      address: {
        type: String,
        trim: true,
        default: "",
      },
    },
  },
  { timestamps: true } // ✅ adds createdAt & updatedAt automatically
);

export default mongoose.model("Order", orderSchema);
