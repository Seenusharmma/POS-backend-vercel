// Suppress console warnings from browser extensions and expected errors
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  const originalError = console.error;

  // Suppress LocatorJS warnings (browser extension)
  console.warn = (...args) => {
    const message = args.join(" ");
    if (
      message.includes("locatorjs") ||
      message.includes("Unsupported React renderer") ||
      message.includes("bundle type") ||
      message.includes("[locatorjs]")
    ) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };

  // Suppress expected WebSocket errors
  console.error = (...args) => {
    const message = args.join(" ");
    
    // Suppress LocatorJS errors
    if (
      message.includes("locatorjs") ||
      message.includes("[locatorjs]") ||
      message.includes("Unsupported React renderer")
    ) {
      return;
    }
    
    // Suppress WebSocket connection errors
    if (
      message.includes("WebSocket connection to") &&
      (message.includes("failed") || 
       message.includes("closed before the connection") ||
       message.includes("WebSocket is closed"))
    ) {
      // Suppress if it's a Vercel URL, localhost, or expected error
      if (
        message.includes("vercel.app") ||
        message.includes("localhost") ||
        message.includes("closed before the connection is established") ||
        message.includes("WebSocket is closed")
      ) {
        return; // Suppress these errors
      }
    }
    
    originalError.apply(console, args);
  };
}

