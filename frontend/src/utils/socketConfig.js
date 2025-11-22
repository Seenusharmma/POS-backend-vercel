import API_BASE from "../config/api";
import { io } from "socket.io-client";

/**
 * ⚡ ULTRA-OPTIMIZED Socket.IO Configuration
 * 
 * Optimizations:
 * - Memoized platform detection
 * - Connection pooling and reuse
 * - Intelligent caching
 * - Memory leak prevention
 * - Debounced event handling
 * - Optimized heartbeat mechanism
 * - Advanced error recovery
 */

// ⚡ Cache serverless check result (only check once)
let _isServerlessCache = null;
const SERVERLESS_CHECK_KEYS = ["vercel.app", "netlify.app", "serverless"];

/**
 * ⚡ Optimized serverless platform detection (memoized)
 * @returns {boolean}
 */
export const isServerlessPlatform = () => {
  if (_isServerlessCache !== null) return _isServerlessCache;
  
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const apiUrl = String(API_BASE || '');
  
  _isServerlessCache = SERVERLESS_CHECK_KEYS.some(
    key => apiUrl.includes(key) || hostname.includes(key)
  );
  
  return _isServerlessCache;
};

// ⚡ Connection pool to reuse sockets efficiently
const connectionPool = new Map();
const MAX_POOL_SIZE = 5;
const PING_INTERVAL = 30000; // 30s optimized
const CONNECTION_TIMEOUT = 15000; // 15s faster timeout
const HEARTBEAT_TIMEOUT = 10000; // 10s heartbeat timeout

// ⚡ Connection metrics cache
const metricsCache = new WeakMap();

// ⚡ Mock socket singleton (reused for serverless)
let mockSocketInstance = null;

/**
 * ⚡ Create optimized mock socket (singleton pattern)
 */
const createMockSocket = () => {
  if (mockSocketInstance) return mockSocketInstance;
  
  mockSocketInstance = Object.freeze({
    on: () => {},
    off: () => {},
    once: () => {},
    emit: () => {},
    disconnect: () => {},
    connect: () => {},
    close: () => {},
    id: null,
    connected: false,
    disconnected: true,
    io: Object.freeze({
      reconnecting: false,
      reconnection: false,
    }),
    metrics: Object.freeze({ quality: "unavailable" }),
    getConnectionQuality: () => "unavailable",
    getLatency: () => null,
  });
  
  return mockSocketInstance;
};

/**
 * ⚡ Generate connection pool key for reuse
 */
const getPoolKey = (url, type, userId) => {
  return `${url}_${type}_${userId || 'anonymous'}`;
};

/**
 * ⚡ Calculate exponential backoff with jitter (optimized)
 */
const calculateBackoff = (attempt, base = 1000, max = 5000) => {
  const exponential = Math.min(base * Math.pow(1.5, attempt), max);
  const jitter = exponential * 0.2 * Math.random(); // 20% jitter
  return Math.floor(exponential + jitter);
};

/**
 * ⚡ Update connection quality based on latency (optimized thresholds)
 */
const updateConnectionQuality = (latency, metrics) => {
  if (latency < 50) metrics.quality = "excellent";
  else if (latency < 150) metrics.quality = "good";
  else if (latency < 300) metrics.quality = "fair";
  else if (latency < 500) metrics.quality = "poor";
  else metrics.quality = "critical";
};

/**
 * ⚡ ULTRA-OPTIMIZED Socket.IO configuration
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.type - Connection type ('admin' | 'user')
 * @param {string|null} options.userId - User ID for authentication
 * @param {boolean} options.autoConnect - Auto-connect on creation
 * @returns {Object} Socket.IO configuration object
 */
export const getSocketConfig = (options = {}) => {
  const isServerless = isServerlessPlatform();
  const { type = "user", userId = null, autoConnect = true } = options;
  
  // ⚡ Early return for serverless (no computation needed)
  if (isServerless) {
    return Object.freeze({
      transports: ["polling"],
      reconnection: false,
      autoConnect: false,
      timeout: 1000,
      forceNew: true,
      upgrade: false,
    });
  }
  
  // ⚡ Optimized configuration object (frozen for immutability)
  return Object.freeze({
    // Transport: WebSocket first, polling fallback
    transports: ["websocket", "polling"],
    upgrade: true,
    rememberUpgrade: true,
    
    // ⚡ Faster connection settings
    timeout: CONNECTION_TIMEOUT,
    forceNew: false, // Reuse connections
    reconnection: true,
    reconnectionDelay: 800, // Faster initial delay
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    randomizationFactor: 0.5,
    
    // ⚡ Optimized exponential backoff
    reconnectionStrategy: calculateBackoff,
    
    autoConnect,
    
    // ⚡ Metadata for tracking
    auth: Object.freeze({ type, userId }),
    
    // ⚡ Performance optimizations
    withCredentials: true,
    path: "/socket.io/",
    compression: true,
    
    // ⚡ Additional optimizations
    allowUpgrades: true,
    perMessageDeflate: true,
    closeOnBeforeunload: false,
  });
};

/**
 * ⚡ ULTRA-OPTIMIZED Socket Connection Creator
 * 
 * Features:
 * - Connection pooling and reuse
 * - Advanced health monitoring
 * - Memory leak prevention
 * - Debounced heartbeat
 * - Smart event cleanup
 * - Error recovery mechanisms
 * 
 * @param {string} url - Server URL
 * @param {Object} config - Socket configuration
 * @param {Object} options - Additional options
 * @returns {Object} Socket instance
 */
export const createSocketConnection = (url, config, options = {}) => {
  // ⚡ Early return for serverless
  if (isServerlessPlatform()) {
    return createMockSocket();
  }
  
  const {
    onConnect = null,
    onDisconnect = null,
    onError = null,
    onReconnect = null,
  } = options;
  
  // ⚡ Check connection pool for reuse
  const poolKey = getPoolKey(url, config?.auth?.type, config?.auth?.userId);
  if (connectionPool.has(poolKey)) {
    const existingSocket = connectionPool.get(poolKey);
    if (existingSocket && existingSocket.connected) {
      return existingSocket;
    }
    // Clean up stale connection
    connectionPool.delete(poolKey);
  }
  
  // ⚡ Limit pool size
  if (connectionPool.size >= MAX_POOL_SIZE) {
    const firstKey = connectionPool.keys().next().value;
    const oldSocket = connectionPool.get(firstKey);
    if (oldSocket) {
      oldSocket.disconnect();
    }
    connectionPool.delete(firstKey);
  }
  
  try {
    const socket = io(url, config);
    
    // ⚡ Connection tracking (optimized)
    const connectionState = {
      startTime: 0,
      reconnectAttempts: 0,
      lastLatency: 0,
      heartbeatTimer: null,
      isCleanedUp: false,
    };
    
    // ⚡ Connection metrics (cached in WeakMap)
    const metrics = {
      connectTime: 0,
      reconnectAttempts: 0,
      lastLatency: 0,
      uptime: 0,
      quality: "good",
      pingHistory: [], // Track last 5 pings
    };
    
    metricsCache.set(socket, metrics);
    
    /**
     * ⚡ Optimized heartbeat with debouncing
     */
    const startHeartbeat = () => {
      if (connectionState.heartbeatTimer) return;
      
      connectionState.heartbeatTimer = setInterval(() => {
        if (!socket.connected || connectionState.isCleanedUp) {
          clearInterval(connectionState.heartbeatTimer);
          connectionState.heartbeatTimer = null;
          return;
        }
        
        const startTime = performance.now(); // Use high-res timer
        
        // ⚡ Optimized ping with timeout
        const pingTimeout = setTimeout(() => {
          // Ping timeout - mark as poor quality
          updateConnectionQuality(HEARTBEAT_TIMEOUT, metrics);
        }, HEARTBEAT_TIMEOUT);
        
        socket.emit("ping", (response) => {
          clearTimeout(pingTimeout);
          
          if (response && !connectionState.isCleanedUp) {
            const latency = Math.floor(performance.now() - startTime);
            
            // ⚡ Update latency (keep only last 5)
            metrics.pingHistory.push(latency);
            if (metrics.pingHistory.length > 5) {
              metrics.pingHistory.shift();
            }
            
            // ⚡ Use average of last 3 pings for smoother quality
            const avgLatency = metrics.pingHistory
              .slice(-3)
              .reduce((a, b) => a + b, 0) / Math.min(3, metrics.pingHistory.length);
            
            connectionState.lastLatency = Math.floor(avgLatency);
            metrics.lastLatency = connectionState.lastLatency;
            
            updateConnectionQuality(connectionState.lastLatency, metrics);
            
            // Attach to socket
            socket.connectionQuality = metrics.quality;
            socket.latency = connectionState.lastLatency;
          }
        });
      }, PING_INTERVAL);
    };
    
    /**
     * ⚡ Cleanup function (prevent memory leaks)
     */
    const cleanup = () => {
      if (connectionState.isCleanedUp) return;
      connectionState.isCleanedUp = true;
      
      if (connectionState.heartbeatTimer) {
        clearInterval(connectionState.heartbeatTimer);
        connectionState.heartbeatTimer = null;
      }
      
      // Remove from pool
      connectionPool.delete(poolKey);
      
      // Cleanup event listeners
      socket.removeAllListeners();
    };
    
    // ⚡ Optimized event handlers
    
    socket.on("connect", () => {
      if (connectionState.isCleanedUp) return;
      
      connectionState.startTime = Date.now();
      metrics.connectTime = connectionState.startTime;
      metrics.reconnectAttempts = connectionState.reconnectAttempts;
      connectionState.reconnectAttempts = 0;
      
      // Add to pool
      connectionPool.set(poolKey, socket);
      
      // Identify connection
      if (config?.auth) {
        socket.emit("identify", config.auth);
      }
      
      // Start heartbeat
      startHeartbeat();
      
      if (onConnect) onConnect(socket);
    });
    
    socket.once("identified", () => {
      // Silently handled
    });
    
    socket.on("disconnect", (reason) => {
      if (connectionState.isCleanedUp) return;
      
      metrics.uptime = Date.now() - connectionState.startTime;
      cleanup();
      
      if (onDisconnect) onDisconnect(reason);
    });
    
    socket.on("connect_error", (error) => {
      if (connectionState.isCleanedUp) return;
      
      connectionState.reconnectAttempts++;
      metrics.reconnectAttempts = connectionState.reconnectAttempts;
      
      // ⚡ Smart error filtering
      const errorMsg = String(error?.message || '');
      const isExpectedError = 
        errorMsg.includes("websocket") ||
        errorMsg.includes("closed before") ||
        errorMsg.includes("xhr poll") ||
        errorMsg.includes("serverless");
      
      if (!isExpectedError && onError) {
        onError(error);
      }
    });
    
    socket.on("reconnect_attempt", (attemptNumber) => {
      connectionState.reconnectAttempts = attemptNumber;
    });
    
    socket.on("reconnect", (attemptNumber) => {
      metrics.reconnectAttempts = attemptNumber;
      startHeartbeat();
      
      if (onReconnect) onReconnect(attemptNumber);
    });
    
    socket.on("reconnect_error", (error) => {
      const errorMsg = String(error?.message || '');
      if (!errorMsg.includes("websocket") && !errorMsg.includes("closed")) {
        // Silently handle expected errors
      }
    });
    
    socket.on("reconnect_failed", () => {
      cleanup();
    });
    
    // ⚡ Attach metrics and helper methods
    socket.metrics = metrics;
    socket.getConnectionQuality = () => metrics.quality;
    socket.getLatency = () => connectionState.lastLatency;
    socket.getUptime = () => Date.now() - connectionState.startTime;
    socket.cleanup = cleanup;
    
    // ⚡ Cleanup on page unload
    if (typeof window !== 'undefined') {
      const handleBeforeUnload = () => cleanup();
      window.addEventListener('beforeunload', handleBeforeUnload);
      socket.on('disconnect', () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      });
    }
    
    return socket;
    
  } catch (error) {
    console.error("❌ Failed to create socket connection:", error);
    return createMockSocket();
  }
};

/**
 * ⚡ Get connection quality metrics (optimized)
 * @param {Object} socket - Socket instance
 * @returns {Object} Quality metrics
 */
export const getConnectionQuality = (socket) => {
  if (!socket || !socket.connected) {
    return Object.freeze({
      quality: "disconnected",
      latency: null,
      connected: false,
      id: null,
    });
  }
  
  const metrics = metricsCache.get(socket) || socket.metrics;
  
  return Object.freeze({
    quality: socket.getConnectionQuality?.() || metrics?.quality || "unknown",
    latency: socket.getLatency?.() || metrics?.lastLatency || null,
    connected: socket.connected,
    id: socket.id,
    uptime: socket.getUptime?.(),
  });
};

/**
 * ⚡ Check if socket is healthy (optimized)
 * @param {Object} socket - Socket instance
 * @returns {boolean}
 */
export const isSocketHealthy = (socket) => {
  if (!socket?.connected) return false;
  
  const quality = socket.getConnectionQuality?.() || "unknown";
  return ["excellent", "good", "fair"].includes(quality);
};

/**
 * ⚡ Cleanup all connections (utility for cleanup)
 */
export const cleanupAllConnections = () => {
  connectionPool.forEach((socket) => {
    if (socket.cleanup) {
      socket.cleanup();
    } else {
      socket.disconnect();
    }
  });
  connectionPool.clear();
  _isServerlessCache = null;
};

/**
 * ⚡ Get connection pool stats (for monitoring)
 */
export const getPoolStats = () => {
  return Object.freeze({
    size: connectionPool.size,
    maxSize: MAX_POOL_SIZE,
    connections: Array.from(connectionPool.keys()),
  });
};
