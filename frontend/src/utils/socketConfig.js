import API_BASE from "../config/api";
import { io } from "socket.io-client";

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
    // On serverless, don't even try to connect - return config that prevents connection
    return {
      transports: ["polling"], // Only polling, no websocket
      reconnection: false, // Don't try to reconnect on serverless
      autoConnect: false, // Don't auto-connect on serverless
      timeout: 1000, // Very short timeout
      forceNew: true,
      upgrade: false, // Don't try to upgrade to WebSocket
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

/**
 * Create a socket connection safely (returns mock on serverless)
 * This prevents WebSocket connection attempts on serverless platforms
 */
export const createSocketConnection = (url, config) => {
  const isServerless = isServerlessPlatform();
  
  if (isServerless) {
    // Return a mock socket that doesn't try to connect
    // This prevents any WebSocket connection attempts
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {},
      connect: () => {},
      close: () => {},
      id: null,
      connected: false,
      disconnected: true,
      io: {
        reconnecting: false,
      },
    };
  }
  
  // On regular servers, create real connection
  try {
    const socket = io(url, config);
    
    // Suppress connection errors for serverless detection
    socket.on("connect_error", (error) => {
      const errorMessage = error.message || "";
      if (errorMessage.includes("vercel.app") || errorMessage.includes("serverless")) {
        // Silently handle - don't log
        return;
      }
    });
    
    return socket;
  } catch (error) {
    // Fallback to mock if import fails
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {},
      connect: () => {},
      close: () => {},
      id: null,
      connected: false,
      disconnected: true,
    };
  }
};

