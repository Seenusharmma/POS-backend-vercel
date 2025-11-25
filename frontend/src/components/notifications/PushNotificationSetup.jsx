import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import {
  initializeFirebasePushNotifications,
  getNotificationPermission,
  isNotificationSupported
} from '../../utils/firebasePushNotifications';
import toast from 'react-hot-toast';

/**
 * Push Notification Setup Component
 * Automatically initializes Firebase Cloud Messaging push notifications when user is logged in
 */
const PushNotificationSetup = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Firebase push notifications when user is logged in
  useEffect(() => {
    if (!user || !user.email || isInitialized) {
      return;
    }

    // Check if browser supports notifications
    if (!isNotificationSupported()) {
      console.log('Firebase push notifications not supported');
      return;
    }

    // Check if permission is already granted (avoid re-initialization)
    const currentPermission = getNotificationPermission();
    if (currentPermission === 'granted') {
      // Check if service worker is already registered
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          console.log('Firebase service worker already registered');
          setIsInitialized(true);
        }
      }).catch(() => {
        // No registration, continue with initialization
      });
    }

    // Auto-initialize Firebase push notifications
    const initPush = async () => {
      try {
        console.log('Initializing Firebase push notifications for:', user.email);
        const result = await initializeFirebasePushNotifications(user.email);
        if (result.success) {
          setIsInitialized(true);
          console.log('✅ Firebase push notifications initialized successfully');
        } else {
          // Don't show error for permission_denied (user might deny it)
          if (result.reason !== 'permission_denied') {
            console.warn('Firebase push notification initialization failed:', result.reason, result.error || '');
          } else {
            console.log('Notification permission not granted by user');
          }
        }
      } catch (error) {
        console.error('Error initializing Firebase push notifications:', error);
      }
    };

    // Small delay to ensure everything is ready (page load, DOM, etc.)
    const timer = setTimeout(initPush, 1500);
    return () => clearTimeout(timer);
  }, [user, isInitialized]);

  return null; // This component doesn't render anything
};

export default PushNotificationSetup;

