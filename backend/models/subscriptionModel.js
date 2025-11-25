import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    // Web Push subscription (for web-push library)
    subscription: {
      type: Object,
      required: false,
    },
    // Firebase Cloud Messaging token
    fcmToken: {
      type: String,
      required: false,
      index: true,
    },
    // Platform type: 'web-push' or 'fcm'
    platform: {
      type: String,
      enum: ['web-push', 'fcm'],
      default: 'fcm',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
subscriptionSchema.index({ userEmail: 1 });
subscriptionSchema.index({ fcmToken: 1 });

// Compound index for userEmail and platform
subscriptionSchema.index({ userEmail: 1, platform: 1 });

const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);

export default Subscription;

