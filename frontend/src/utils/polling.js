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
      
      // ✅ Validate that newData is valid
      if (!newData) {
        return;
      }
      
      // Compare data if compare function provided
      if (compareFn && lastData !== null) {
        const hasChanged = compareFn(lastData, newData);
        if (hasChanged && onUpdate) {
          onUpdate(newData, lastData);
        }
      } else if (lastData === null) {
        // First poll - always call onUpdate with null as oldData
        if (onUpdate) {
          onUpdate(newData, null);
        }
      } else {
        // ✅ Simple comparison - always update if different
        // Use JSON.stringify for deep comparison
        if (JSON.stringify(lastData) !== JSON.stringify(newData)) {
          if (onUpdate) {
            onUpdate(newData, lastData);
          }
        }
      }
      
      lastData = newData;
    } catch (error) {
      // ✅ Silent error handling - don't spam console on serverless
      // Only log if it's not a network error (which is expected on serverless)
      const errorMessage = error?.message || "";
      if (!errorMessage.includes("network") && !errorMessage.includes("fetch")) {
        console.warn("Polling error:", errorMessage);
      }
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
 * ✅ Poll for orders and detect new/updated orders
 * Optimized for both serverless (Vercel) and regular servers
 */
export const pollOrders = (fetchOrders, onNewOrder, onStatusChange, interval = 3000) => {
  let lastOrders = [];
  let lastOrderIds = new Set();
  let lastOrderMap = new Map(); // Map for faster lookups

  const onUpdate = (newOrders, oldOrders) => {
    // ✅ CRITICAL FIX: Only skip on FIRST load (null/undefined), not when array is empty
    // This was preventing detection of the first order when starting from empty state
    if (oldOrders === null || oldOrders === undefined) {
      lastOrders = Array.isArray(newOrders) ? [...newOrders] : [];
      lastOrderIds = new Set(lastOrders.map(o => o._id));
      lastOrderMap = new Map(lastOrders.map(o => [o._id, o]));
      return;
    }

    // ✅ Validate newOrders is an array
    if (!Array.isArray(newOrders)) {
      return;
    }

    const newOrderIds = new Set(newOrders.map(o => o._id));
    const newOrderMap = new Map(newOrders.map(o => [o._id, o]));
    
    // ✅ Check for new orders (orders that weren't in the previous list)
    newOrders.forEach(order => {
      if (!order || !order._id) return; // Skip invalid orders
      
      if (!lastOrderIds.has(order._id)) {
        // This is a completely new order
        if (onNewOrder && order.status !== "Complete") {
          onNewOrder(order);
        }
      }
    });

    // ✅ Check for removed orders (orders that were in old list but not in new)
    lastOrders.forEach(oldOrder => {
      if (!newOrderIds.has(oldOrder._id)) {
        // Order was removed (likely completed)
        if (oldOrder.status !== "Complete" && onStatusChange) {
          // Treat as completed
          onStatusChange({ ...oldOrder, status: "Complete" }, oldOrder);
        }
      }
    });

    // ✅ Check for status changes and payment status changes
    newOrders.forEach(newOrder => {
      if (!newOrder || !newOrder._id) return; // Skip invalid orders
      
      const oldOrder = lastOrderMap.get(newOrder._id);
      
      if (oldOrder) {
        // ✅ Check status changes
        if (oldOrder.status !== newOrder.status) {
          if (onStatusChange) {
            onStatusChange(newOrder, oldOrder);
          }
        }
        
        // ✅ Check payment status changes
        if (oldOrder.paymentStatus !== newOrder.paymentStatus && newOrder.paymentStatus === "Paid") {
          if (onStatusChange) {
            onStatusChange(newOrder, oldOrder);
          }
        }
        
        // ✅ Check other field changes (quantity, price, etc.)
        if (JSON.stringify(oldOrder) !== JSON.stringify(newOrder)) {
          // Order was updated but no specific handler - still call statusChange if status changed
          if (oldOrder.status === newOrder.status && onStatusChange) {
            onStatusChange(newOrder, oldOrder);
          }
        }
      } else if (!lastOrderIds.has(newOrder._id)) {
        // ✅ Order is brand new (not in previous poll)
        // This handles orders that appear between polls
        if (onNewOrder && newOrder.status !== "Complete") {
          onNewOrder(newOrder);
        }
      }
    });

    // ✅ Update stored data for next comparison
    lastOrders = [...newOrders];
    lastOrderIds = newOrderIds;
    lastOrderMap = newOrderMap;
  };

  return createPolling(
    fetchOrders,
    interval,
    onUpdate,
    null // No compare function, we handle comparison in onUpdate
  );
};

