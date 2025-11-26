/**
 * TABLE OPTIONS CONFIGURATION:
 * - Total Tables: 40 tables (numbered 1-40)
 * - Chairs per Table: 4 chairs per table
 * - Table Numbering: Tables are numbered from 1 to 40
 * - Chair Indices: Each table has 4 chairs indexed 0-3 (top row: 0,1 | bottom row: 2,3)
 * - Delivery Orders: Use tableNumber = 0 for delivery/takeaway orders (not dine-in)
 * - Table Selection: Users can select multiple chairs at the same table
 * - Availability: Tables are considered booked if they have active orders (status !== "Completed" && status !== "Served")
 */
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
      // TABLE OPTIONS: 
      // - For dine-in: Table number 1-40 (40 total tables available)
      // - For delivery/takeaway: Use tableNumber = 0
      // - Each table has 4 chairs (indices 0-3)
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
