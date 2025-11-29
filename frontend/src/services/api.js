// Centralized API configuration
// Automatically detects development vs production
const getApiBase = () => {
  // Check if VITE_API_BASE_URL is explicitly set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check if we're in development (localhost)
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('localhost');
  
  if (isDevelopment) {
    // Development: use localhost backend on port 8000
    return 'http://localhost:8000';
  }
  
  // Production: use relative path (assuming Vercel rewrites or same-domain hosting)
  // Or fallback to a default if needed, but relative is safest for Vercel rewrites
  return '';
};

const API_BASE = getApiBase();

export default API_BASE;

