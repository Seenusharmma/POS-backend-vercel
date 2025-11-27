import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync } from 'fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    // Copy service worker to dist root for production builds
    {
      name: 'copy-service-worker',
      closeBundle() {
        try {
          const source = 'public/service-worker.js';
          const dest = 'dist/service-worker.js';
          
          if (existsSync(source)) {
            copyFileSync(source, dest);
            console.log('✅ Service worker copied to dist/service-worker.js');
          } else {
            console.warn('⚠️ Service worker source file not found:', source);
          }
        } catch (error) {
          console.error('❌ Failed to copy service worker:', error.message);
        }
      }
    },
    // Copy Firebase messaging service worker for mobile push notifications
    {
      name: 'copy-firebase-messaging-sw',
      closeBundle() {
        try {
          const source = 'public/firebase-messaging-sw.js';
          const dest = 'dist/firebase-messaging-sw.js';
          
          if (existsSync(source)) {
            copyFileSync(source, dest);
            console.log('✅ Firebase messaging service worker copied to dist/firebase-messaging-sw.js');
          } else {
            console.warn('⚠️ Firebase messaging SW source file not found:', source);
          }
        } catch (error) {
          console.error('❌ Failed to copy Firebase messaging SW:', error.message);
        }
      }
    }
  ],
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
    exclude: ['locatorjs'], // Exclude locatorjs to suppress warnings
  },
  build: {
    // Suppress console warnings in production
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress locatorjs warnings (browser extension)
        if (warning.message && warning.message.includes('locatorjs')) {
          return;
        }
        warn(warning);
      }
    }
  },
  // Ensure service worker is served correctly
  publicDir: 'public',
  server: {
    // Allow service worker to work in development
    headers: {
      'Service-Worker-Allowed': '/'
    }
  }
})
