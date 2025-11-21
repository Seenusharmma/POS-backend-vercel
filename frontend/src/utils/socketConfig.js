import API_BASE from "../config/api";

/**
 * Check if we're running on a serverless platform (Vercel, etc.)
 * Serverless platforms don't support WebSockets
 */
export const isServerlessPlatform = () => {
  return (
    API_BASE.includes("vercel.app") ||
    API_BASE.includes("netlify.app") ||
    API_BASE.includes("serverless") ||
    window.location.hostname.includes("vercel.app") ||
    window.location.hostname.includes("netlify.app")
  );
};

/**
 * Get socket.io configuration optimized for the current environment
 */
export const getSocketConfig = () => {
  const isServerless = isServerlessPlatform();
  
  if (isServerless) {
    // On serverless, only use polling (no WebSocket)
    return {
      transports: ["polling"], // Only polling, no websocket
      reconnection: false, // Don't try to reconnect on serverless
      autoConnect: false, // Don't auto-connect on serverless
      timeout: 5000,
    };
  }
  
  // On regular servers, try websocket first, fallback to polling
  return {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 5,
    timeout: 10000,
    autoConnect: true,
    forceNew: false,
    upgrade: true,
  };
};

