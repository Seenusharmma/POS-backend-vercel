import express from "express";
import webpush from "web-push";
import dotenv from "dotenv";
import Subscription from "../models/subscriptionModel.js";

dotenv.config();

const router = express.Router();

// Configure VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log("✅ VAPID keys configured for push notifications");
} else {
  console.warn("⚠️ VAPID keys not configured. Run: node scripts/generateVapidKeys.js");
}

// GET /api/push/vapid-key - Get VAPID public key
router.get("/vapid-key", (req, res) => {
  if (!vapidPublicKey) {
    return res.status(500).json({ 
      error: "VAPID keys not configured. Please run: node scripts/generateVapidKeys.js" 
    });
  }
  res.json({ publicKey: vapidPublicKey });
});

// POST /api/push/subscribe - Save user subscription
router.post("/subscribe", async (req, res) => {
  try {
    const { subscription, userEmail } = req.body;

    if (!subscription || !userEmail) {
      return res.status(400).json({ error: "Subscription and userEmail are required" });
    }

    // Save or update subscription with platform set to 'web-push'
    await Subscription.findOneAndUpdate(
      { userEmail, platform: 'web-push' },
      {
        userEmail,
        subscription,
        platform: 'web-push', // Explicitly set platform
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Web Push subscription saved for: ${userEmail}`);
    res.json({ success: true, message: "Subscription saved" });
  } catch (error) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// POST /api/push/unsubscribe - Remove user subscription
router.post("/unsubscribe", async (req, res) => {
  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required" });
    }

    await Subscription.deleteOne({ userEmail });
    console.log(`✅ Push subscription removed for: ${userEmail}`);
    res.json({ success: true, message: "Subscription removed" });
  } catch (error) {
    console.error("Error removing subscription:", error);
    res.status(500).json({ error: "Failed to remove subscription" });
  }
});

// POST /api/push/send - Send push notification to user
router.post("/send", async (req, res) => {
  try {
    const { userEmail, title, body, icon, data, tag } = req.body;

    if (!userEmail || !title || !body) {
      return res.status(400).json({ error: "userEmail, title, and body are required" });
    }

    // Get user's subscription
    const subscriptionDoc = await Subscription.findOne({ userEmail });
    if (!subscriptionDoc) {
      return res.status(404).json({ error: "User subscription not found" });
    }

    // Send push notification
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: tag || "default",
      data: data || {},
      requireInteraction: false
    });

    try {
      await webpush.sendNotification(subscriptionDoc.subscription, payload);
      console.log(`✅ Push notification sent to: ${userEmail}`);
      res.json({ success: true, message: "Notification sent" });
    } catch (error) {
      // If subscription is invalid, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        await Subscription.deleteOne({ userEmail });
        console.log(`🗑️ Removed invalid subscription for: ${userEmail}`);
        return res.status(410).json({ error: "Subscription expired", removed: true });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// POST /api/push/send-all - Send push notification to all subscribed users
router.post("/send-all", async (req, res) => {
  try {
    const { title, body, icon, data, tag } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    // Get all subscriptions
    const subscriptions = await Subscription.find({});
    
    if (subscriptions.length === 0) {
      return res.json({ success: true, sent: 0, message: "No subscriptions found" });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: tag || "broadcast",
      data: data || {},
      requireInteraction: false
    });

    let sent = 0;
    let failed = 0;
    const invalidSubscriptions = [];

    // Send to all subscriptions
    for (const subDoc of subscriptions) {
      try {
        await webpush.sendNotification(subDoc.subscription, payload);
        sent++;
      } catch (error) {
        failed++;
        // Mark invalid subscriptions for removal
        if (error.statusCode === 410 || error.statusCode === 404) {
          invalidSubscriptions.push(subDoc._id);
        }
      }
    }

    // Remove invalid subscriptions
    if (invalidSubscriptions.length > 0) {
      await Subscription.deleteMany({ _id: { $in: invalidSubscriptions } });
      console.log(`🗑️ Removed ${invalidSubscriptions.length} invalid subscriptions`);
    }

    console.log(`✅ Push notification sent: ${sent} successful, ${failed} failed`);
    res.json({ 
      success: true, 
      sent, 
      failed, 
      total: subscriptions.length,
      message: `Sent to ${sent} users` 
    });
  } catch (error) {
    console.error("Error sending push notifications:", error);
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

export default router;

