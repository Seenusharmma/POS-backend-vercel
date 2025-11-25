/**
 * Push Notification Utility
 * Free push notifications using browser's Web Push API
 * No third-party API keys required - uses VAPID keys (self-generated)
 */

// Check if browser supports notifications
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Browser does not support notifications');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Check current notification permission
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Register service worker
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    console.log('Service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

// Subscribe to push notifications
export const subscribeToPush = async (vapidPublicKey) => {
  try {
    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Already subscribed to push notifications');
      return subscription;
    }

    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('Subscribed to push notifications:', subscription);
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

// Get current subscription
export const getPushSubscription = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
};

// Convert VAPID public key from base64 URL to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Show local notification (for testing or when push is not available)
export const showLocalNotification = async (title, options = {}) => {
  const permission = getNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body: options.body || '',
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      tag: options.tag || 'default',
      requireInteraction: options.requireInteraction || false,
      data: options.data || {},
      actions: options.actions || [],
      vibrate: [200, 100, 200],
      ...options
    });
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Initialize push notifications
export const initializePushNotifications = async (vapidPublicKey, userEmail) => {
  try {
    // Check support
    if (!isNotificationSupported()) {
      console.warn('Push notifications not supported in this browser');
      return { success: false, reason: 'unsupported' };
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'permission_denied', permission };
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, reason: 'service_worker_failed' };
    }

    // Subscribe to push
    const subscription = await subscribeToPush(vapidPublicKey);
    if (!subscription) {
      return { success: false, reason: 'subscription_failed' };
    }

    // Send subscription to backend
    const subscriptionData = subscription.toJSON();
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    const response = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscriptionData,
        userEmail: userEmail
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }

    console.log('Push notifications initialized successfully');
    return { success: true, subscription };
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return { success: false, reason: 'initialization_failed', error: error.message };
  }
};

