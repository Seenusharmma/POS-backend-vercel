import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { 
  initializePushNotifications, 
  showLocalNotification,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported
} from '../../utils/pushNotifications';
import API_BASE from '../../config/api';
import toast from 'react-hot-toast';

/**
 * Test Push Notification Component
 * Use this to test push notifications on localhost
 */
const TestPushNotification = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [vapidKey, setVapidKey] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch VAPID key
  React.useEffect(() => {
    const fetchKey = async () => {
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
    fetchKey();
  }, []);

  // Check browser support
  const checkSupport = () => {
    const supported = isNotificationSupported();
    const permission = getNotificationPermission();
    
    toast.info(
      `Support: ${supported ? '✅ Yes' : '❌ No'}\nPermission: ${permission}`,
      { duration: 3000 }
    );
    
    console.log('Browser Support:', {
      supported,
      permission,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushManager: 'PushManager' in window,
      hasNotification: 'Notification' in window
    });
  };

  // Request permission and initialize
  const handleInitialize = async () => {
    if (!user || !user.email) {
      toast.error('Please login first');
      return;
    }

    if (!vapidKey) {
      toast.error('VAPID key not loaded');
      return;
    }

    setLoading(true);
    try {
      const result = await initializePushNotifications(vapidKey, user.email);
      if (result.success) {
        toast.success('✅ Push notifications initialized!');
      } else {
        toast.error(`Failed: ${result.reason}`);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test local notification
  const handleTestLocal = async () => {
    const permission = getNotificationPermission();
    
    if (permission === 'default') {
      const newPermission = await requestNotificationPermission();
      if (newPermission !== 'granted') {
        toast.error('Permission denied');
        return;
      }
    } else if (permission !== 'granted') {
      toast.error('Notification permission not granted');
      return;
    }

    const success = await showLocalNotification('🧪 Test Notification', {
      body: 'This is a test notification from localhost!',
      icon: '/favicon.ico',
      tag: 'test',
      data: { test: true }
    });

    if (success) {
      toast.success('Local notification sent!');
    } else {
      toast.error('Failed to show notification');
    }
  };

  // Test push notification from backend
  const handleTestPush = async () => {
    if (!user || !user.email) {
      toast.error('Please login first');
      return;
    }

    setLoading(true);
    try {
      console.log('Testing push notification with API_BASE:', API_BASE);
      const response = await fetch(`${API_BASE}/api/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          title: '🧪 Test Push Notification',
          body: 'This is a test push notification!',
          icon: '/favicon.ico',
          tag: 'test-push',
          data: { test: true, timestamp: Date.now() }
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('✅ Push notification sent!');
        console.log('Push notification result:', result);
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Push notification failed:', error);
        toast.error(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isNotificationSupported()) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          ⚠️ Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  const permission = getNotificationPermission();

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-xl font-bold mb-4">🧪 Test Push Notifications</h3>
      
      <div className="space-y-4">
        {/* Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Permission:</strong> {permission}
          </p>
          <p className="text-sm text-gray-600">
            <strong>User:</strong> {user?.email || 'Not logged in'}
          </p>
          <p className="text-sm text-gray-600">
            <strong>VAPID Key:</strong> {vapidKey ? '✅ Loaded' : '❌ Not loaded'}
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={checkSupport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            🔍 Check Support
          </button>

          <button
            onClick={handleInitialize}
            disabled={loading || !user || !vapidKey}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Initializing...' : '🚀 Initialize Push'}
          </button>

          <button
            onClick={handleTestLocal}
            disabled={permission !== 'granted'}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            📱 Test Local Notification
          </button>

          <button
            onClick={handleTestPush}
            disabled={loading || !user || !vapidKey}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Sending...' : '📤 Test Push Notification'}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p className="font-semibold mb-2">📋 How to Test:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Check Support" to verify browser compatibility</li>
            <li>Click "Initialize Push" to request permission and subscribe</li>
            <li>Click "Test Local Notification" to test browser notifications</li>
            <li>Click "Test Push Notification" to test server-sent push notifications</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestPushNotification;

