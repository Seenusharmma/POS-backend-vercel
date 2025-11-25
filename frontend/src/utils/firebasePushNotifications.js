/**
 * Firebase Cloud Messaging Push Notification Utility
 * Uses Firebase Cloud Messaging for push notifications
 */

import { messaging, getFCMToken, onMessageListener } from '../services/firebase.js';
import API_BASE from '../services/api.js';

// Check if browser supports notifications
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && messaging !== null;
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

// Register Firebase service worker
export const registerFirebaseServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    // Check if we're on HTTPS or localhost (required for service workers)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      console.warn('Service workers require HTTPS (or localhost)');
      return null;
    }

    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration) {
      console.log('Service worker already registered');
      await navigator.serviceWorker.ready;
      return existingRegistration;
    }

    // Register Firebase messaging service worker
    console.log('Registering Firebase messaging service worker...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('Firebase service worker registered:', registration.scope);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Firebase service worker is ready');
    
    return registration;
  } catch (error) {
    console.error('Firebase service worker registration failed:', error);
    return null;
  }
};

// Initialize Firebase push notifications
export const initializeFirebasePushNotifications = async (userEmail) => {
  try {
    // Check support
    if (!isNotificationSupported()) {
      console.warn('Firebase push notifications not supported in this browser');
      return { success: false, reason: 'unsupported' };
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted:', permission);
      return { success: false, reason: 'permission_denied', permission };
    }

    // Register service worker
    console.log('Registering Firebase service worker...');
    const registration = await registerFirebaseServiceWorker();
    if (!registration) {
      console.error('Firebase service worker registration failed');
      return { success: false, reason: 'service_worker_failed' };
    }

    // Get FCM token
    console.log('Getting FCM token...');
    const fcmToken = await getFCMToken();
    if (!fcmToken) {
      console.error('Failed to get FCM token');
      return { success: false, reason: 'token_failed' };
    }

    // Send token to backend
    console.log('Saving FCM token to backend...');
    const response = await fetch(`${API_BASE}/api/push/fcm-subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fcmToken: fcmToken,
        userEmail: userEmail
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to save FCM token:', errorData);
      throw new Error(errorData.error || 'Failed to save FCM token');
    }

    const result = await response.json();
    console.log('✅ Firebase push notifications initialized successfully:', result);
    
    // Set up foreground message listener
    onMessageListener().then((payload) => {
      if (payload) {
        console.log('Foreground message received:', payload);
        // Show notification manually for foreground messages
        if (payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: payload.data?.tag || 'default',
            data: payload.data || {}
          });
        }
      }
    });

    return { success: true, fcmToken, result };
  } catch (error) {
    console.error('Error initializing Firebase push notifications:', error);
    return { 
      success: false, 
      reason: 'initialization_failed', 
      error: error.message,
      details: error 
    };
  }
};

// Unsubscribe from Firebase push notifications
export const unsubscribeFirebasePush = async (userEmail) => {
  try {
    const response = await fetch(`${API_BASE}/api/push/fcm-unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: userEmail
      })
    });

    if (!response.ok) {
      throw new Error('Failed to unsubscribe');
    }

    console.log('Unsubscribed from Firebase push notifications');
    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from Firebase push:', error);
    return { success: false, error: error.message };
  }
};

// Show local notification (for testing)
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
      badge: '/favicon.ico',
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

