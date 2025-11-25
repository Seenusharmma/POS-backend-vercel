import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subscription: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
subscriptionSchema.index({ userEmail: 1 });

const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);

export default Subscription;

