/**
 * Polling utility for real-time updates on serverless platforms
 * Since WebSockets don't work on Vercel/serverless, we use polling as a fallback
 */

/**
 * Create a polling function that fetches data at regular intervals
 * @param {Function} fetchFunction - Function that returns a Promise with the data
 * @param {number} interval - Polling interval in milliseconds (default: 3000ms)
 * @param {Function} onUpdate - Callback function when data changes
 * @param {Function} compareFn - Optional function to compare old and new data to detect changes
 * @returns {Function} - Function to stop polling
 */
export const createPolling = (fetchFunction, interval = 3000, onUpdate, compareFn = null) => {
  let pollingInterval = null;
  let lastData = null;
  let isPolling = false;

  const poll = async () => {
    if (isPolling) return; // Prevent concurrent polls
    isPolling = true;

    try {
      const newData = await fetchFunction();
      
      // Compare data if compare function provided
      if (compareFn && lastData !== null) {
        const hasChanged = compareFn(lastData, newData);
        if (hasChanged && onUpdate) {
          onUpdate(newData, lastData);
        }
      } else if (lastData === null || JSON.stringify(lastData) !== JSON.stringify(newData)) {
        // Simple comparison if no compare function
        if (onUpdate) {
          onUpdate(newData, lastData);
        }
      }
      
      lastData = newData;
    } catch (error) {
      console.error("Polling error:", error);
    } finally {
      isPolling = false;
    }
  };

  // Start polling
  pollingInterval = setInterval(poll, interval);
  
  // Initial poll
  poll();

  // Return stop function
  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    lastData = null;
    isPolling = false;
  };
};

/**
 * Poll for orders and detect new/updated orders
 */
export const pollOrders = (fetchOrders, onNewOrder, onStatusChange, interval = 3000) => {
  let lastOrders = [];
  let lastOrderIds = new Set();

  const onUpdate = (newOrders, oldOrders) => {
    if (!oldOrders || oldOrders.length === 0) {
      // First load, just store the data
      lastOrders = newOrders;
      lastOrderIds = new Set(newOrders.map(o => o._id));
      return;
    }

    const newOrderIds = new Set(newOrders.map(o => o._id));
    
    // Check for new orders
    newOrders.forEach(order => {
      if (!lastOrderIds.has(order._id)) {
        if (onNewOrder) {
          onNewOrder(order);
        }
      }
    });

    // Check for status changes and payment status changes
    newOrders.forEach(newOrder => {
      const oldOrder = lastOrders.find(o => o._id === newOrder._id);
      if (oldOrder) {
        // Check status changes
        if (oldOrder.status !== newOrder.status) {
          if (onStatusChange) {
            onStatusChange(newOrder, oldOrder);
          }
        }
        
        // Check payment status changes
        if (oldOrder.paymentStatus !== newOrder.paymentStatus && newOrder.paymentStatus === "Paid") {
          if (onStatusChange) {
            onStatusChange(newOrder, oldOrder);
          }
        }
      }
    });

    // Update stored data
    lastOrders = newOrders;
    lastOrderIds = newOrderIds;
  };

  return createPolling(
    fetchOrders,
    interval,
    onUpdate,
    null // No compare function, we handle comparison in onUpdate
  );
};

