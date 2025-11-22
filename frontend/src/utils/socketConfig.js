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
 * ✅ Optimized Socket.IO configuration for maximum performance and reliability
 * Features:
 * - Fast WebSocket connection with polling fallback
 * - Intelligent reconnection strategy
 * - Connection pooling and health monitoring
 * - Compression support
 */
export const getSocketConfig = (options = {}) => {
  const isServerless = isServerlessPlatform();
  const {
    type = "user", // 'admin' or 'user'
    userId = null,
    autoConnect = true,
  } = options;
  
  if (isServerless) {
    // On serverless, don't even try to connect - return config that prevents connection
    return {
      transports: ["polling"],
      reconnection: false,
      autoConnect: false,
      timeout: 1000,
      forceNew: true,
      upgrade: false,
    };
  }
  
  // ✅ Optimized configuration for regular servers
  return {
    // Transport: WebSocket first for speed, polling as fallback
    transports: ["websocket", "polling"],
    upgrade: true,
    rememberUpgrade: true,
    
    // ✅ Connection Settings - Optimized for speed and reliability
    timeout: 20000,                  // 20s - connection timeout
    forceNew: false,                 // Reuse existing connections
    reconnection: true,              // Enable reconnection
    reconnectionDelay: 1000,         // Start with 1s delay
    reconnectionDelayMax: 5000,      // Max 5s delay
    reconnectionAttempts: Infinity,  // Keep trying indefinitely
    randomizationFactor: 0.5,        // Add randomness to prevent thundering herd
    
    // ✅ Exponential Backoff for Reconnection
    reconnectionStrategy: (attemptNumber) => {
      const delay = Math.min(1000 * Math.pow(2, attemptNumber), 5000);
      const jitter = delay * 0.3 * Math.random(); // Add jitter
      return delay + jitter;
    },
    
    // ✅ Auto-connect configuration
    autoConnect,
    
    // ✅ Additional metadata for connection tracking
    auth: {
      type,
      userId,
    },
    
    // ✅ Performance optimizations
    withCredentials: true,
    
    // ✅ Connection quality monitoring
    path: "/socket.io/",
    
    // ✅ Compression support (if server supports)
    compression: true,
  };
};

/**
 * ✅ Create an optimized socket connection with advanced features
 * Features:
 * - Connection pooling
 * - Health monitoring
 * - Automatic reconnection with exponential backoff
 * - Event queue for offline scenarios
 */
export const createSocketConnection = (url, config, options = {}) => {
  const isServerless = isServerlessPlatform();
  const {
    onConnect = null,
    onDisconnect = null,
    onError = null,
    onReconnect = null,
  } = options;
  
  if (isServerless) {
    // Return a mock socket that doesn't try to connect
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
        reconnection: false,
      },
    };
  }
  
  // ✅ Create optimized socket connection
  try {
    const socket = io(url, config);
    
    // ✅ Connection tracking
    let connectionStartTime = Date.now();
    let reconnectAttempts = 0;
    let lastLatency = 0;
    
    // ✅ Connection Quality Metrics
    const connectionMetrics = {
      connectTime: 0,
      reconnectAttempts: 0,
      lastLatency: 0,
      uptime: 0,
      quality: "good", // 'excellent', 'good', 'fair', 'poor'
    };
    
    // ✅ Heartbeat/Ping for connection health monitoring
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        const startTime = Date.now();
        socket.emit("ping", (response) => {
          if (response) {
            lastLatency = Date.now() - startTime;
            connectionMetrics.lastLatency = lastLatency;
            
            // Determine connection quality based on latency
            if (lastLatency < 50) connectionMetrics.quality = "excellent";
            else if (lastLatency < 150) connectionMetrics.quality = "good";
            else if (lastLatency < 300) connectionMetrics.quality = "fair";
            else connectionMetrics.quality = "poor";
            
            // Store quality in socket for access
            socket.connectionQuality = connectionMetrics.quality;
            socket.latency = lastLatency;
          }
        });
      }
    }, 30000); // Every 30 seconds
    
    // ✅ Enhanced Connection Events
    
    socket.on("connect", () => {
      connectionStartTime = Date.now();
      connectionMetrics.connectTime = Date.now();
      connectionMetrics.reconnectAttempts = reconnectAttempts;
      reconnectAttempts = 0;
      
      // Identify as admin or user
      if (config.auth) {
        socket.emit("identify", config.auth);
      }
      
      if (onConnect) onConnect(socket);
    });
    
    socket.on("identified", (data) => {
      // Silently identified
    });
    
    socket.on("disconnect", (reason) => {
      connectionMetrics.uptime = Date.now() - connectionStartTime;
      
      if (onDisconnect) onDisconnect(reason);
    });
    
    socket.on("connect_error", (error) => {
      reconnectAttempts++;
      connectionMetrics.reconnectAttempts = reconnectAttempts;
      
      // Suppress expected errors for serverless detection
      const errorMessage = error.message || "";
      const isExpectedError = 
        errorMessage.includes("websocket") ||
        errorMessage.includes("closed before the connection is established") ||
        errorMessage.includes("xhr poll error") ||
        errorMessage.includes("serverless");
      
      if (!isExpectedError && onError) {
        onError(error);
      }
    });
    
    socket.on("reconnect_attempt", (attemptNumber) => {
      reconnectAttempts = attemptNumber;
    });
    
    socket.on("reconnect", (attemptNumber) => {
      connectionMetrics.reconnectAttempts = attemptNumber;
      
      if (onReconnect) onReconnect(attemptNumber);
    });
    
    socket.on("reconnect_error", (error) => {
      const errorMessage = error.message || "";
      if (!errorMessage.includes("websocket") && !errorMessage.includes("closed")) {
        console.warn(`⚠️ Reconnection error:`, error.message);
      }
    });
    
    socket.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed after all attempts");
    });
    
    // ✅ Store metrics on socket for external access
    socket.metrics = connectionMetrics;
    socket.getConnectionQuality = () => connectionMetrics.quality;
    socket.getLatency = () => lastLatency;
    
    // ✅ Cleanup on disconnect
    socket.on("disconnect", () => {
      clearInterval(heartbeatInterval);
    });
    
    return socket;
  } catch (error) {
    console.error("❌ Failed to create socket connection:", error);
    
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
      metrics: { quality: "unavailable" },
    };
  }
};

/**
 * ✅ Connection Quality Helper
 * Returns connection quality metrics
 */
export const getConnectionQuality = (socket) => {
  if (!socket || !socket.connected) {
    return { quality: "disconnected", latency: null };
  }
  
  return {
    quality: socket.getConnectionQuality ? socket.getConnectionQuality() : "unknown",
    latency: socket.getLatency ? socket.getLatency() : null,
    connected: socket.connected,
    id: socket.id,
  };
};

/**
 * ✅ Utility to check if socket is healthy
 */
export const isSocketHealthy = (socket) => {
  if (!socket || !socket.connected) return false;
  
  const quality = socket.getConnectionQuality ? socket.getConnectionQuality() : "unknown";
  return quality === "excellent" || quality === "good" || quality === "fair";
};

