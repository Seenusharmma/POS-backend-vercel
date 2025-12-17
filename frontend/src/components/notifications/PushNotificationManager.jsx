import { useEffect, useRef } from 'react';
import { useAppSelector } from '../../store/hooks';
import { initializePushNotifications } from '../../utils/pushNotifications';
import API_BASE from '../../config/api';

/**
 * PushNotificationManager - Initializes and manages push notifications
 * Automatically subscribes users to push notifications when logged in
 */
const PushNotificationManager = () => {
  const { user } = useAppSelector((state) => state.auth);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Reset initialization when user changes (e.g. logout/login)
    // but we only want to run once per user session mount
    if (!user) {
        initializedRef.current = false;
        return;
    }

    if (initializedRef.current) return;

    const setupPushNotifications = async () => {
      // Only initialize if user is logged in
      if (!user || !user.email) {
        return;
      }
      
      // Mark as initialized immediately to prevent race conditions
      initializedRef.current = true;

      try {

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

        // Initialize push notifications
        const result = await initializePushNotifications(publicKey, user.email);

        if (result.success) {
          // Successfully enabled
        } else {
          console.warn('⚠️ Push notifications not enabled:', result.reason);
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
