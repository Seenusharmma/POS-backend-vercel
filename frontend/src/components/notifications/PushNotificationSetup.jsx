import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { initializePushNotifications } from '../../utils/pushNotifications';
import toast from 'react-hot-toast';
import API_BASE from '../../config/api';

/**
 * Push Notification Setup Component
 * Automatically initializes FREE Web Push notifications when user is logged in
 * Uses browser's native Web Push API - NO Firebase or third-party services required!
 */
const PushNotificationSetup = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  const [vapidKey, setVapidKey] = useState(null);

  // Fetch VAPID public key from backend
  useEffect(() => {
    const fetchVapidKey = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/push/vapid-key`);
        if (response.ok) {
          const data = await response.json();
          setVapidKey(data.publicKey);
          console.log('✅ VAPID public key fetched');
        } else {
          console.warn('⚠️ Failed to fetch VAPID key:', response.statusText);
        }
      } catch (error) {
        console.warn('⚠️ Error fetching VAPID key:', error);
      }
    };

    fetchVapidKey();
  }, []);

  // Initialize Web Push notifications when user is logged in and VAPID key is available
  useEffect(() => {
    if (!user || !user.email || !vapidKey || isInitialized) {
      return;
    }

    // Check if browser supports notifications
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('⚠️ Push notifications not supported in this browser');
      return;
    }

    // Auto-initialize Web Push notifications
    const initPush = async () => {
      try {
        console.log('🔔 Initializing FREE Web Push notifications for:', user.email);
        const result = await initializePushNotifications(vapidKey, user.email);
        
        if (result.success) {
          setIsInitialized(true);
          console.log('✅ Push notifications enabled successfully!');
          
          // Show subtle success toast (only once)
          toast.success('🔔 Push notifications enabled!', {
            duration: 3000,
            position: 'bottom-center',
            style: {
              background: '#10b981',
              color: '#fff',
              fontSize: '14px',
            },
          });
        } else {
          // Handle different failure reasons
          if (result.reason === 'permission_denied') {
            console.log('ℹ️ User denied notification permission');
          } else if (result.reason === 'unsupported') {
            console.log('ℹ️ Push notifications not supported');
          } else {
            console.warn('⚠️ Push notification setup failed:', result.reason, result.error || '');
          }
        }
      } catch (error) {
        console.error('❌ Error initializing push notifications:', error);
      }
    };

    // Small delay to ensure everything is ready (page load, DOM, etc.)
    const timer = setTimeout(initPush, 2000);
    return () => clearTimeout(timer);
  }, [user, vapidKey, isInitialized]);

  return null; // This component doesn't render anything
};

export default PushNotificationSetup;

