import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { initializeFirebasePushNotifications } from '../../utils/firebasePushNotifications';
import toast from 'react-hot-toast';

/**
 * Push Notification Setup Component
 * Uses Firebase Cloud Messaging for universal mobile & desktop support
 * Works on iOS Safari, Android Chrome, and all desktop browsers
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
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('⚠️ Push notifications not supported in this browser');
      return;
    }

    // Auto-initialize Firebase Cloud Messaging
    const initPush = async () => {
      try {
        console.log('🔔 Initializing Firebase Cloud Messaging for:', user.email);
        const result = await initializeFirebasePushNotifications(user.email);
        
        if (result.success) {
          setIsInitialized(true);
          console.log('✅ Firebase push notifications enabled successfully!');
          console.log('📱 FCM Token:', result.fcmToken);
          
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
          } else if (result.reason === 'token_failed') {
            console.warn('⚠️ Failed to get FCM token. Check Firebase configuration.');
            console.warn('💡 Make sure VITE_FIREBASE_VAPID_KEY is set in .env');
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
  }, [user, isInitialized]);

  return null; // This component doesn't render anything
};

export default PushNotificationSetup;

