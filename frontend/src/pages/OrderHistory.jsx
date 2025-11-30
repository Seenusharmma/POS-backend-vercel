import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { useAppSelector } from "../store/hooks";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../config/api";
import OrderSlip from "../features/orders/OrderSlip";
import { getSocketConfig, isServerlessPlatform, createSocketConnection } from "../utils/socketConfig";
import { pollOrders } from "../utils/polling";
import OrderHistoryCard from "../features/orders/History/OrderHistoryCard";
import EmptyState from "../features/orders/History/EmptyState";
import { motion } from "framer-motion";

const OrderHistory = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState([]);
  const socketRef = useRef(null);
  const pollingStopRef = useRef(null);

  // ✅ Fetch user's completed orders
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE}/api/orders`);
      // Filter for user's completed orders (check both email and userId)
      const userOrders = res.data.filter(
        (o) =>
          (o.userEmail === user.email || o.userId === user.uid) &&
          o.status === "Completed"
      );
      // Sort by creation date (newest first)
      const sortedOrders = userOrders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
    } catch (err) {
      toast.error("Failed to fetch order history!");
      console.error(err);
    }
  }, [user]);

  // Group orders by order session (same date, same user)
  const groupOrdersBySession = useCallback((ordersList) => {
    const groups = {};
    ordersList.forEach((order) => {
      const date = new Date(order.createdAt).toDateString();
      const key = `${date}_${order.userEmail}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });
    return Object.values(groups);
  }, []);

  // Group and sort orders (newest first)
  const groupedOrders = useMemo(() => {
    // Group by session
    const grouped = groupOrdersBySession(orders);

    // Sort grouped orders by newest first
    grouped.sort((a, b) => {
      const firstA = a[0];
      const firstB = b[0];
      return new Date(firstB.createdAt) - new Date(firstA.createdAt);
    });

    return grouped;
  }, [orders, groupOrdersBySession]);

  // Group orders by date for display
  const groupedByDate = useMemo(() => {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    groupedOrders.forEach((orderGroup) => {
      const orderDate = new Date(orderGroup[0].createdAt);
      // Normalize to date only (remove time component)
      const orderDateOnly = new Date(
        orderDate.getFullYear(),
        orderDate.getMonth(),
        orderDate.getDate()
      );
      
      let groupKey = "older";

      if (orderDateOnly.getTime() === today.getTime()) {
        groupKey = "today";
      } else if (orderDateOnly.getTime() === yesterday.getTime()) {
        groupKey = "yesterday";
      } else if (orderDateOnly >= thisWeek && orderDateOnly < today) {
        groupKey = "thisWeek";
      } else if (orderDateOnly >= thisMonth && orderDateOnly < thisWeek) {
        groupKey = "thisMonth";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(orderGroup);
    });

    return groups;
  }, [groupedOrders]);

  const dateGroupLabels = {
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    older: "Older",
  };

  // Handle view order slip
  const handleViewOrderSlip = (orderGroup) => {
    setSelectedOrderGroup(orderGroup);
    setShowOrderSlip(true);
  };

  useEffect(() => {
    fetchHistory();
  }, [user, fetchHistory]);

  // Real-time socket notifications and polling
  useEffect(() => {
    if (!user) return;

    const isServerless = isServerlessPlatform();

    // Set up socket connection (for local development)
    if (!socketRef.current) {
      if (isServerless) {
        // On serverless platforms, create a mock socket
        socketRef.current = {
          on: () => {},
          off: () => {},
          emit: () => {},
          disconnect: () => {},
          connect: () => {},
          connected: false,
        };
      } else {
        // ✅ On regular servers, create real socket connection as user
        const socketConfig = getSocketConfig({
          type: "user",
          userId: user?.uid || null,
          autoConnect: true,
        });
        socketRef.current = createSocketConnection(API_BASE, socketConfig);
      }
    }
    const socket = socketRef.current;

    // ✅ Connection event listeners
    socket.on("connect", () => {
      // ✅ CRITICAL: Identify as user after connection to join user room
      if (socket && typeof socket.emit === "function" && user?.uid) {
        setTimeout(() => {
          socket.emit("identify", { type: "user", userId: user.uid });
        }, 100);
      }
    });

    // ✅ Listen for identification confirmation
    socket.on("identified", (data) => {
      // User successfully identified and joined user room
    });

    socket.on("disconnect", () => {
      // Socket disconnected
    });

    socket.on("connect_error", (error) => {
      const errorMessage = error.message || "";
      const isExpectedError =
        errorMessage.includes("websocket") ||
        errorMessage.includes("closed before the connection is established") ||
        API_BASE.includes("vercel.app");

      if (!isExpectedError) {
        console.error("❌ Socket connection error:", error);
      }
    });

    // Listen for new orders (booking) - Real-time UI update
    socket.on("newOrderPlaced", (newOrder) => {
      if (newOrder.userEmail === user.email || newOrder.userId === user.uid) {
        // Update UI immediately if order is completed
        if (newOrder.status === "Completed") {
          setOrders((prev) => {
            const exists = prev.find((o) => o._id === newOrder._id);
            if (!exists) {
              return [newOrder, ...prev];
            }
            return prev;
          });
        }
        toast.success(`📦 New Order: ${newOrder.foodName}`, {
          duration: 4000,
          position: "top-center",
        });
        fetchHistory();
      }
    });

    // ✅ Listen for status changes - Real-time UI update
    socket.on("orderStatusChanged", (updatedOrder) => {
      // ✅ Verify order belongs to current user
      if (!user || !updatedOrder || !updatedOrder._id) {
        return;
      }

      const isUserOrder =
        updatedOrder.userEmail === user.email ||
        updatedOrder.userId === user.uid;

      if (!isUserOrder) {
        return; // Not user's order, ignore
      }

      // ✅ CRITICAL: When order status changes to "Completed", add to history
      if (updatedOrder.status === "Completed") {
        setOrders((prev) => {
          const existingIndex = prev.findIndex((o) => o._id === updatedOrder._id);

          if (existingIndex >= 0) {
            // Update existing order with all fields
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...updatedOrder };
            // Sort by date (newest first)
            return updated.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
          } else {
            // ✅ NEW: Add new completed order to history with notification
            toast.success(
              `🎉 Order Completed: ${updatedOrder.foodName}. Added to history!`,
              {
                duration: 5000,
                position: "top-center",
                icon: "✅",
                style: {
                  background: "#10b981",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "600",
                },
              }
            );
            // Add to beginning and sort by date
            const newOrders = [updatedOrder, ...prev];
            return newOrders.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
          }
        });
      } else {
        // ✅ If order status changed FROM Completed, remove it from history
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
      }
    });

    // Listen for payment success - Real-time UI update

    // ✅ Set up polling for serverless platforms (Vercel)
    if (isServerless) {
      const fetchCompletedOrdersForPolling = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/orders`);
          return res.data.filter(
            (o) =>
              (o.userEmail === user.email || o.userId === user.uid) &&
              o.status === "Completed"
          );
        } catch (error) {
          console.error("Error fetching completed orders for polling:", error);
          return [];
        }
      };

      // Start polling for completed orders
      pollingStopRef.current = pollOrders(
        fetchCompletedOrdersForPolling,
        // onNewOrder callback (when a new completed order appears)
        (newOrder) => {
          setOrders((prev) => {
            const exists = prev.find((o) => o._id === newOrder._id);
            if (!exists) {
              toast.success(`🎉 Order completed: ${newOrder.foodName}`, {
                duration: 4000,
                position: "top-center",
              });
              return [newOrder, ...prev];
            }
            return prev;
          });
        },
        // onStatusChange callback (when order status changes to Completed)
        (updatedOrder, oldOrder) => {
          // When order becomes completed, add it to history immediately
          if (
            updatedOrder.status === "Completed" &&
            oldOrder.status !== "Completed"
          ) {
            setOrders((prev) => {
              const existingIndex = prev.findIndex(
                (o) => o._id === updatedOrder._id
              );
              if (existingIndex >= 0) {
                // Update existing order
                const updated = [...prev];
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  ...updatedOrder,
                };
                return updated;
              } else {
                // Add new completed order to history
                toast.success(`🎉 Order completed: ${updatedOrder.foodName}`, {
                  duration: 4000,
                  position: "top-center",
                });
                return [updatedOrder, ...prev];
              }
            });
            // Refresh history to ensure all completed orders are shown
            fetchHistory();
          }

        },
        3000 // Poll every 3 seconds
      );
    }

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("newOrderPlaced");
      socket.off("orderStatusChanged");

      // Stop polling if it's running
      if (pollingStopRef.current) {
        pollingStopRef.current();
        pollingStopRef.current = null;
      }
    };
  }, [user, fetchHistory]);

  return (
    <div className="px-3 sm:px-4 md:px-6 lg:px-10 py-6 sm:py-8 min-h-screen bg-gradient-to-b from-yellow-50 to-white mt-10 pb-20 md:pb-8">
      <Toaster />
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center text-red-700 mb-4 sm:mb-6 px-2"
      >
        Your Order History
      </motion.h2>

      {/* Handle States */}
      {!user ? (
        <EmptyState type="noOrders" />
      ) : orders.length === 0 ? (
        <EmptyState type="noOrders" onRefresh={fetchHistory} />
      ) : (
        <div className="max-w-6xl mx-auto">
          {/* Orders List */}
          {groupedOrders.length === 0 ? (
            <EmptyState type="noOrders" onRefresh={fetchHistory} />
          ) : (
            <div className="space-y-6">
              {Object.keys(dateGroupLabels).map((groupKey) => {
                const groupOrders = groupedByDate[groupKey] || [];
                if (groupOrders.length === 0) return null;

                return (
                  <div key={groupKey} className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-700 border-b border-gray-200 pb-2">
                      {dateGroupLabels[groupKey]}
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {groupOrders.map((orderGroup, index) => (
                        <motion.div
                          key={`${orderGroup[0]._id}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <OrderHistoryCard
                            orderGroup={orderGroup}
                            onViewSlip={handleViewOrderSlip}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Order Slip Modal */}
      <OrderSlip
        isOpen={showOrderSlip}
        onClose={() => {
          setShowOrderSlip(false);
          setSelectedOrderGroup([]);
        }}
        orders={selectedOrderGroup}
        totalAmount={
          selectedOrderGroup.reduce((sum, o) => sum + (o.price || 0), 0)
        }
        userName={user?.displayName || "Guest User"}
        userEmail={user?.email || ""}
        orderDate={selectedOrderGroup[0]?.createdAt || new Date()}
      />
    </div>
  );
};

export default OrderHistory;
