import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { initializePushNotifications } from '../../utils/pushNotifications';
import API_BASE from '../../config/api';

/**
 * PushNotificationManager - Initializes and manages push notifications
 * Automatically subscribes users to push notifications when logged in
 */
const PushNotificationManager = () => {
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const setupPushNotifications = async () => {
      // Only initialize if user is logged in
      if (!user || !user.email) {
        console.log('[Push] User not logged in, skipping push notification setup');
        return;
      }

      try {
        console.log('[Push] Initializing push notifications for:', user.email);

        // Fetch VAPID public key from backend
        const response = await fetch(`${API_BASE}/api/push/vapid-key`);
        
        if (!response.ok) {
          console.warn('[Push] Failed to fetch VAPID key:', response.status);
          return;
        }

        const { publicKey } = await response.json();
        
        if (!publicKey) {
          console.warn('[Push] No VAPID public key received from server');
          return;
        }

        console.log('[Push] VAPID public key received');

        // Initialize push notifications
        const result = await initializePushNotifications(publicKey, user.email);

        if (result.success) {
          console.log('✅ Push notifications enabled successfully');
        } else {
          console.warn('⚠️ Push notifications not enabled:', result.reason);
          
          // Log specific reasons for debugging
          if (result.reason === 'permission_denied') {
            console.log('[Push] User denied notification permission');
          } else if (result.reason === 'unsupported') {
            console.log('[Push] Browser does not support push notifications');
          } else if (result.reason === 'service_worker_failed') {
            console.log('[Push] Service worker registration failed');
          }
        }
      } catch (error) {
        console.error('[Push] Error setting up push notifications:', error);
      }
    };

    setupPushNotifications();
  }, [user]);

  // This component doesn't render anything
  return null;
};

export default PushNotificationManager;
