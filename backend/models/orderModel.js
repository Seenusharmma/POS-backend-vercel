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
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Cash", "Other"],
      default: "UPI",
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
