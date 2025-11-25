import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
