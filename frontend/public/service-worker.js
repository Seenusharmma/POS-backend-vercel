// Service Worker for Push Notifications
// This file must be in the public folder to be accessible at the root
// Works on both HTTP (localhost) and HTTPS (production/Vercel)

const CACHE_NAME = 'food-app-v2';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install event - cache resources and skip waiting for immediate activation
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker: Installing...', self.location.origin);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Service Worker: Caching files');
        return cache.addAll(urlsToCache).catch((error) => {
          // Don't fail if some files can't be cached
          console.warn('[SW] Some files could not be cached:', error);
        });
      })
      .catch((error) => {
        console.error('[SW] Service Worker: Cache failed', error);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
  console.log('[SW] Service Worker: Installation complete');
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
  console.log('[SW] Service Worker: Activated and ready');
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event);
  
  let notificationData = {
    title: 'Food App',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    requireInteraction: false,
    data: {}
  };

  // Parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Service Worker: Parsed push data', data);
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || []
      };
    } catch (e) {
      // If not JSON, try text
      console.log('Service Worker: Push data is not JSON, using text');
      const textData = event.data.text();
      notificationData.body = textData || notificationData.body;
    }
  } else {
    console.log('Service Worker: No push data received');
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.actions,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }).then(() => {
      console.log('Service Worker: Notification shown successfully');
    }).catch((error) => {
      console.error('Service Worker: Error showing notification', error);
    })
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Handle action buttons if any
  if (event.action) {
    console.log('Action clicked:', event.action);
    // Handle specific actions here
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // If not open, open new window
        if (clients.openWindow) {
          const urlToOpen = event.notification.data?.url || '/';
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

