// Suppress console warnings from browser extensions and expected errors
// This must run BEFORE any socket.io connections are attempted
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  // Helper to check if message should be suppressed
  const shouldSuppress = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Suppress LocatorJS warnings/errors
    if (
      lowerMessage.includes("locatorjs") ||
      lowerMessage.includes("unsupported react renderer") ||
      lowerMessage.includes("bundle type") ||
      lowerMessage.includes("[locatorjs]")
    ) {
      return true;
    }
    
    // Suppress ALL WebSocket/Socket.IO related messages (very aggressive)
    if (
      lowerMessage.includes("websocket") ||
      lowerMessage.includes("socket.io") ||
      lowerMessage.includes("socketio") ||
      lowerMessage.includes("socket io") ||
      lowerMessage.includes("wss://") ||
      lowerMessage.includes("ws://") ||
      lowerMessage.includes("transport=websocket") ||
      lowerMessage.includes("transport=ws") ||
      lowerMessage.includes("eio=4") ||
      lowerMessage.includes("eio=") ||
      lowerMessage.includes("createsocket") ||
      lowerMessage.includes("doopen") ||
      lowerMessage.includes("_open") ||
      lowerMessage.includes("connection to") ||
      lowerMessage.includes("failed to connect") ||
      lowerMessage.includes("connection failed") ||
      (lowerMessage.includes("connection") && lowerMessage.includes("failed")) ||
      (lowerMessage.includes("connection") && lowerMessage.includes("error")) ||
      lowerMessage.includes("closed before") ||
      lowerMessage.includes("websocket is closed") ||
      lowerMessage.includes("websocket closed") ||
      lowerMessage.includes("xhr poll error") ||
      lowerMessage.includes("polling error") ||
      lowerMessage.includes("transport error") ||
      lowerMessage.includes("socket connection") ||
      (lowerMessage.includes("vercel.app") && lowerMessage.includes("socket")) ||
      (lowerMessage.includes("vercel") && (lowerMessage.includes("socket") || lowerMessage.includes("ws"))) ||
      lowerMessage.includes("network error") && lowerMessage.includes("socket")
    ) {
      return true;
    }
    
    return false;
  };

  // Suppress LocatorJS warnings (browser extension)
  console.warn = (...args) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };

  // Suppress expected WebSocket errors
  console.error = (...args) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
  };

  // Also suppress WebSocket errors in console.log (some libraries use it)
  console.log = (...args) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      return; // Suppress WebSocket-related logs
    }
    originalLog.apply(console, args);
  };
  
  // Also intercept Error objects being logged
  const originalErrorConstructor = Error;
  // Note: We can't override Error constructor, but the console methods above should catch it
  
  // Global error handler to catch WebSocket errors
  window.addEventListener("error", (event) => {
    const errorMessage = (event.message || "").toLowerCase();
    if (
      errorMessage.includes("websocket") ||
      errorMessage.includes("socket.io") ||
      errorMessage.includes("wss://") ||
      errorMessage.includes("ws://") ||
      errorMessage.includes("connection") && errorMessage.includes("failed")
    ) {
      event.preventDefault(); // Prevent error from showing in console
      return false;
    }
  }, true);
  
  // Also catch unhandled promise rejections related to WebSockets
  window.addEventListener("unhandledrejection", (event) => {
    const errorMessage = (event.reason?.message || String(event.reason) || "").toLowerCase();
    if (
      errorMessage.includes("websocket") ||
      errorMessage.includes("socket.io") ||
      errorMessage.includes("wss://") ||
      errorMessage.includes("ws://") ||
      (errorMessage.includes("connection") && errorMessage.includes("failed"))
    ) {
      event.preventDefault(); // Prevent error from showing in console
      return false;
    }
  });
}

