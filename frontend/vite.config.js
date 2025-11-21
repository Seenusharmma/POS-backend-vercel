import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  }
})
