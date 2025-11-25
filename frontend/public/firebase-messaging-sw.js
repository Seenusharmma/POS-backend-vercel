// Firebase Cloud Messaging Service Worker
// This file must be in the public folder
// IMPORTANT: Update the firebaseConfig below with your actual Firebase config values

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// IMPORTANT: Update these values with your actual Firebase config from .env
// Service workers can't access environment variables, so you must hardcode them here
const firebaseConfig = {
  apiKey: "AIzaSyAKWtp1-MG9G3aclNOTo4t4xCMOslOvazk",
  authDomain: "food-fantasy-26e65.firebaseapp.com",
  projectId: "food-fantasy-26e65",
  storageBucket: "food-fantasy-26e65.firebasestorage.app",
  messagingSenderId: "141220621227",
  appId: "1:141220621227:web:72222a545d0dc4c20300ee",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Food App';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: payload.notification?.icon || payload.data?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  // Handle action buttons if any
  if (event.action) {
    console.log('Action clicked:', event.action);
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

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

