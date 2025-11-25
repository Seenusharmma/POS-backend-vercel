import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import {
  initializePushNotifications,
  getNotificationPermission,
  isNotificationSupported
} from '../../utils/pushNotifications';
import API_BASE from '../../config/api';
import toast from 'react-hot-toast';

/**
 * Push Notification Setup Component
 * Automatically initializes push notifications when user is logged in
 */
const PushNotificationSetup = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [vapidKey, setVapidKey] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch VAPID public key from backend
  useEffect(() => {
    const fetchVapidKey = async () => {
      try {
        console.log('Fetching VAPID key from:', API_BASE);
        const response = await fetch(`${API_BASE}/api/push/vapid-key`);
        if (response.ok) {
          const data = await response.json();
          if (data.publicKey) {
            setVapidKey(data.publicKey);
            console.log('✅ VAPID key fetched successfully');
          } else {
            console.error('VAPID key not found in response');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch VAPID key:', response.status, errorData);
        }
      } catch (error) {
        console.error('Error fetching VAPID key:', error);
      }
    };

    fetchVapidKey();
  }, []);

  // Initialize push notifications when user is logged in
  useEffect(() => {
    if (!user || !user.email || !vapidKey || isInitialized) {
      return;
    }

    // Check if browser supports notifications
    if (!isNotificationSupported()) {
      console.log('Push notifications not supported');
      return;
    }

    // Check if permission is already granted (avoid re-initialization)
    const currentPermission = getNotificationPermission();
    if (currentPermission === 'granted') {
      // Check if service worker is already registered
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          // Check if already subscribed
          registration.pushManager.getSubscription().then(subscription => {
            if (subscription) {
              console.log('Push notifications already initialized');
              setIsInitialized(true);
            }
          }).catch(() => {
            // Not subscribed, continue with initialization
          });
        }
      }).catch(() => {
        // No registration, continue with initialization
      });
    }

    // Auto-initialize push notifications
    const initPush = async () => {
      try {
        console.log('Initializing push notifications for:', user.email);
        const result = await initializePushNotifications(vapidKey, user.email);
        if (result.success) {
          setIsInitialized(true);
          console.log('✅ Push notifications initialized successfully');
        } else {
          // Don't show error for permission_denied (user might deny it)
          if (result.reason !== 'permission_denied') {
            console.warn('Push notification initialization failed:', result.reason, result.error || '');
          } else {
            console.log('Notification permission not granted by user');
          }
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    // Small delay to ensure everything is ready (page load, DOM, etc.)
    const timer = setTimeout(initPush, 1500);
    return () => clearTimeout(timer);
  }, [user, vapidKey, isInitialized]);

  return null; // This component doesn't render anything
};

export default PushNotificationSetup;

