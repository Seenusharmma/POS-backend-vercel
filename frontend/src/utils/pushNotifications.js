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
    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration) {
      console.log('Service worker already registered:', existingRegistration);
      // Wait for service worker to be ready
      await existingRegistration.update();
      return existingRegistration;
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    });
    
    console.log('Service worker registered:', registration);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service worker is ready');
    
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

// Subscribe to push notifications
export const subscribeToPush = async (vapidPublicKey, registration = null) => {
  try {
    // Get service worker registration - use provided or wait for ready
    let serviceWorkerRegistration = registration;
    
    if (!serviceWorkerRegistration) {
      // Wait for service worker to be ready
      serviceWorkerRegistration = await navigator.serviceWorker.ready;
    }
    
    if (!serviceWorkerRegistration || !serviceWorkerRegistration.pushManager) {
      throw new Error('Service worker registration or push manager not available');
    }
    
    // Check if already subscribed
    let subscription = await serviceWorkerRegistration.pushManager.getSubscription();
    
    if (subscription) {
      // Check if subscription is still valid (has keys)
      const subscriptionKeys = subscription.toJSON().keys;
      if (subscriptionKeys && subscriptionKeys.p256dh && subscriptionKeys.auth) {
        console.log('Already subscribed to push notifications');
        return subscription;
      } else {
        // Subscription exists but is invalid, unsubscribe first
        console.log('Invalid subscription found, unsubscribing...');
        await subscription.unsubscribe();
        subscription = null;
      }
    }

    // Subscribe to push notifications
    if (!subscription) {
      subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('Subscribed to push notifications:', subscription);
    }
    
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

    // Validate VAPID key
    if (!vapidPublicKey || typeof vapidPublicKey !== 'string') {
      console.error('Invalid VAPID public key provided');
      return { success: false, reason: 'invalid_vapid_key' };
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted:', permission);
      return { success: false, reason: 'permission_denied', permission };
    }

    // Register service worker and wait for it to be ready
    console.log('Registering service worker...');
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('Service worker registration failed');
      return { success: false, reason: 'service_worker_failed' };
    }

    // Ensure service worker is ready before subscribing
    console.log('Waiting for service worker to be ready...');
    await navigator.serviceWorker.ready;
    console.log('Service worker is ready, subscribing to push...');

    // Subscribe to push with the registration
    const subscription = await subscribeToPush(vapidPublicKey, registration);
    if (!subscription) {
      console.error('Push subscription failed');
      return { success: false, reason: 'subscription_failed' };
    }

    // Send subscription to backend
    const subscriptionData = subscription.toJSON();
    if (!subscriptionData || !subscriptionData.keys) {
      console.error('Invalid subscription data');
      return { success: false, reason: 'invalid_subscription_data' };
    }

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    console.log('Saving subscription to backend...');
    
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
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to save subscription:', errorData);
      throw new Error(errorData.error || 'Failed to save subscription');
    }

    const result = await response.json();
    console.log('✅ Push notifications initialized successfully:', result);
    return { success: true, subscription, result };
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return { 
      success: false, 
      reason: 'initialization_failed', 
      error: error.message,
      details: error 
    };
  }
};

