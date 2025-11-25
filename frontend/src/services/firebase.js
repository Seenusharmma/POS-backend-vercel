import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase Messaging initialization failed:', error);
}

export { messaging };

// Get FCM token
export const getFCMToken = async () => {
  if (!messaging) {
    console.warn('Firebase Messaging is not available');
    return null;
  }

  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VITE_FIREBASE_VAPID_KEY is not set');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    if (token) {
      console.log('FCM Token:', token);
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () => {
  if (!messaging) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      resolve(payload);
    });
  });
};
