import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useAppSelector } from "../store/hooks";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../config/api";
import OrderSlip from "./OrderPage/OrderSlip";
import { FaReceipt } from "react-icons/fa";
import { getSocketConfig, isServerlessPlatform, createSocketConnection } from "../utils/socketConfig";
import { pollOrders } from "../utils/polling";

const OrderHistory = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState([]);
  const socketRef = useRef(null);
  const pollingStopRef = useRef(null);

  // ✅ Fetch user's completed orders
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/orders`);
      // Filter for user's completed orders (check both email and userId)
      const userOrders = res.data.filter(
        (o) => 
          (o.userEmail === user.email || o.userId === user.uid) && 
          o.status === "Completed"
      );
      // Sort by creation date (newest first)
      const sortedOrders = userOrders.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
    } catch (err) {
      toast.error("Failed to fetch order history!");
      console.error(err);
    }
    setLoading(false);
  }, [user]);

  // Group orders by order session (same table, same date, same user)
  const groupOrdersBySession = (ordersList) => {
    const groups = {};
    ordersList.forEach((order) => {
      const date = new Date(order.createdAt).toDateString();
      const key = `${order.tableNumber}_${date}_${order.userEmail}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });
    return Object.values(groups);
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
      console.log("❌ Socket disconnected");
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
        (updatedOrder.userEmail === user.email) || 
        (updatedOrder.userId === user.uid);
      
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
            return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
            return newOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          }
        });
      } else {
        // ✅ If order status changed FROM Completed, remove it from history
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
      }
    });

    // Listen for payment success - Real-time UI update
    socket.on("paymentSuccess", (orderData) => {
      if (orderData && (orderData.userEmail === user.email || orderData.userId === user.uid)) {
        // Update UI immediately
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderData._id ? { ...o, paymentStatus: "Paid" } : o
          )
        );
        toast.success("💰 Payment Done! Your payment has been confirmed.", {
          duration: 5000,
          icon: "✅",
          style: {
            background: "#10b981",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
          },
          position: "top-center",
        });
        fetchHistory();
      }
    });

    // ✅ Set up polling for serverless platforms (Vercel)
    if (isServerless) {
      const fetchCompletedOrdersForPolling = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/orders`);
          return res.data.filter(
            (o) => (o.userEmail === user.email || o.userId === user.uid) && o.status === "Completed"
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
          if (updatedOrder.status === "Completed" && oldOrder.status !== "Completed") {
            setOrders((prev) => {
              const existingIndex = prev.findIndex((o) => o._id === updatedOrder._id);
              if (existingIndex >= 0) {
                // Update existing order
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], ...updatedOrder };
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

          // Handle payment status changes
          if (updatedOrder.paymentStatus !== oldOrder.paymentStatus && updatedOrder.paymentStatus === "Paid") {
            setOrders((prev) =>
              prev.map((o) =>
                o._id === updatedOrder._id ? { ...o, paymentStatus: "Paid", paymentMethod: updatedOrder.paymentMethod } : o
              )
            );
            toast.success("💰 Payment Done! Your payment has been confirmed.", {
              duration: 5000,
              icon: "✅",
              style: {
                background: "#10b981",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "600",
              },
              position: "top-center",
            });
            // Refresh history after payment update
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
      socket.off("paymentSuccess");
      
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
      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center text-red-700 mb-4 sm:mb-6 px-2">
        📜 My Order History
      </h2>

      {/* Handle States */}
      {!user ? (
        <div className="text-center px-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Please login to view your order history.
          </p>
        </div>
      ) : loading ? (
        <div className="text-center px-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Loading your history...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center px-4">
          <p className="text-gray-600 text-sm sm:text-base mb-4">
            You have no completed orders yet.
          </p>
          <button
            onClick={fetchHistory}
            className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base transition shadow-md"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 max-w-4xl mx-auto">
          {groupOrdersBySession(orders).map((orderGroup, groupIndex) => {
            const firstOrder = orderGroup[0];
            const totalAmount = orderGroup.reduce((sum, o) => sum + (o.price || 0), 0);
            const totalWithGST = totalAmount * 1.05;
            
            return (
              <div
                key={`group-${groupIndex}-${firstOrder._id}`}
                className="bg-white shadow-md hover:shadow-lg transition-all rounded-lg sm:rounded-xl border border-gray-100 p-3 sm:p-4 md:p-5 lg:p-6"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3 sm:mb-4 gap-2">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-800 mb-1">
                      Order #{firstOrder._id?.slice(-8).toUpperCase() || "ORDER"}
                    </h3>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {new Date(firstOrder.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-red-600">
                      Total: ₹{totalWithGST.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleViewOrderSlip(orderGroup)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
                    >
                      <FaReceipt /> View Slip
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-3 border-b border-gray-200 pb-3">
                  {orderGroup.map((order) => (
                    <div key={order._id} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {order.foodName} × {order.quantity}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {order.category} • {order.type}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-700 ml-2">
                        ₹{Number(order.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-2">
                  {firstOrder.isInRestaurant === false ? (
                    <span className="text-blue-600 font-medium">🚚 Delivery</span>
                  ) : (
                    <span>
                      Table: <span className="font-medium">{firstOrder.tableNumber}</span>
                    </span>
                  )}
                  <span className="hidden sm:inline">|</span>
                  <span>
                    Items: <span className="font-medium">{orderGroup.length}</span>
                  </span>
                  <span className="hidden sm:inline">|</span>
                  <span>
                    Payment:{" "}
                    <span className={`font-semibold ${
                      firstOrder.paymentStatus === "Paid" ? "text-green-600" : "text-yellow-600"
                    }`}>
                      {firstOrder.paymentStatus === "Paid" ? "✅ Paid" : "💳 Pending"}
                    </span>
                  </span>
                </div>

                {/* Status Badge */}
                <div className="mt-2 sm:mt-3">
                  <span
                    className={`inline-block px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      firstOrder.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {firstOrder.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Refresh Button (for mobile users convenience) */}
      {user && orders.length > 0 && (
        <div className="flex justify-center mt-6 sm:mt-8 px-4">
          <button
            onClick={fetchHistory}
            className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base shadow-md transition w-full sm:w-auto"
          >
            🔄 Refresh Orders
          </button>
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
        totalAmount={selectedOrderGroup.reduce((sum, o) => sum + (o.price || 0), 0) * 1.05}
        tableNumber={selectedOrderGroup[0]?.tableNumber || 0}
        selectedChairsCount={1}
        isInRestaurant={selectedOrderGroup[0]?.isInRestaurant !== false}
        userName={user?.displayName || "Guest User"}
        userEmail={user?.email || ""}
        orderDate={selectedOrderGroup[0]?.createdAt || new Date()}
      />
    </div>
  );
};

export default OrderHistory;
