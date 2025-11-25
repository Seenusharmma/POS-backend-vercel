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
        const response = await fetch(`${API_BASE}/api/push/vapid-key`);
        if (response.ok) {
          const data = await response.json();
          setVapidKey(data.publicKey);
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

    // Auto-initialize push notifications
    const initPush = async () => {
      try {
        const result = await initializePushNotifications(vapidKey, user.email);
        if (result.success) {
          setIsInitialized(true);
          console.log('✅ Push notifications initialized successfully');
        } else {
          // Don't show error for permission_denied (user might deny it)
          if (result.reason !== 'permission_denied') {
            console.warn('Push notification initialization failed:', result.reason);
          } else {
            console.log('Notification permission not granted by user');
          }
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    // Small delay to ensure everything is ready
    const timer = setTimeout(initPush, 1000);
    return () => clearTimeout(timer);
  }, [user, vapidKey, isInitialized]);

  return null; // This component doesn't render anything
};

export default PushNotificationSetup;

