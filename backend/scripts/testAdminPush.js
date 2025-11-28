import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendPushToAdmins } from '../utils/sendPushNotification.js';

dotenv.config();

const testAdminPush = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🚀 Sending test push to admins...');
    const result = await sendPushToAdmins(
      "🔔 Test Admin Notification",
      "This is a test notification to verify admin push works.",
      { tag: 'test-admin-push' }
    );

    console.log('Result:', JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testAdminPush();
