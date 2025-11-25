import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
let firebaseAdmin = null;

try {
  // Check if Firebase service account credentials are provided
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccount) {
    // Parse service account from JSON string (for Vercel environment variables)
    const serviceAccountJson = typeof serviceAccount === 'string' 
      ? JSON.parse(serviceAccount) 
      : serviceAccount;

    if (!admin.apps.length) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      firebaseAdmin = admin.app();
      console.log('✅ Firebase Admin SDK already initialized');
    }
  } else {
    console.warn('⚠️ Firebase service account not configured. Firebase push notifications disabled.');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
}

/**
 * Send push notification to a specific user using FCM token
 * @param {string} fcmToken - User's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} options - Additional options (icon, data, tag)
 */
export const sendFCMNotification = async (fcmToken, title, body, options = {}) => {
  try {
    if (!firebaseAdmin) {
      console.warn('⚠️ Firebase Admin SDK not initialized. Push notifications disabled.');
      return { success: false, error: 'Firebase Admin SDK not initialized' };
    }

    if (!fcmToken) {
      return { success: false, error: 'FCM token is required' };
    }

    const message = {
      notification: {
        title: title,
        body: body,
        imageUrl: options.icon || undefined,
      },
      data: {
        ...options.data,
        tag: options.tag || 'default',
        click_action: options.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
      },
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: options.icon || '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: options.requireInteraction || false,
        },
        fcmOptions: {
          link: options.url || '/',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ FCM notification sent successfully: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    
    // Handle invalid token
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      return { 
        success: false, 
        error: 'Invalid or unregistered FCM token', 
        shouldRemove: true 
      };
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple users
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} options - Additional options
 */
export const sendFCMNotificationToMultiple = async (fcmTokens, title, body, options = {}) => {
  try {
    if (!firebaseAdmin) {
      console.warn('⚠️ Firebase Admin SDK not initialized. Push notifications disabled.');
      return { success: false, error: 'Firebase Admin SDK not initialized' };
    }

    if (!fcmTokens || fcmTokens.length === 0) {
      return { success: false, error: 'FCM tokens are required' };
    }

    const message = {
      notification: {
        title: title,
        body: body,
        imageUrl: options.icon || undefined,
      },
      data: {
        ...options.data,
        tag: options.tag || 'broadcast',
      },
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: options.icon || '/favicon.ico',
          badge: '/favicon.ico',
        },
      },
    };

    // Send to multiple tokens (batch send)
    const response = await firebaseAdmin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      ...message,
    });

    console.log(`✅ FCM notifications sent: ${response.successCount} successful, ${response.failureCount} failed`);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error('Error sending FCM notifications:', error);
    return { success: false, error: error.message };
  }
};

export default firebaseAdmin;

