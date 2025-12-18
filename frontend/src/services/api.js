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
  
  // Production: use deployed backend URL
  // Update this to match your actual Vercel backend deployment URL
  const fallbackUrl = 'https://pos-backend-vercel.vercel.app';
  console.warn(`⚠️ API_BASE not set. Falling back to: ${fallbackUrl}. Set VITE_API_BASE_URL in your environment if this is incorrect.`);
  return fallbackUrl;
};

const API_BASE = getApiBase();
console.log("🔌 API Base URL:", API_BASE);

export default API_BASE;

