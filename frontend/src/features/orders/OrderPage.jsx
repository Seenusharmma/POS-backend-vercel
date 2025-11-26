import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { updateQuantityAsync, removeFromCartAsync, clearCartAsync } from "../../store/slices/cartSlice";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaShoppingBag, FaChair } from "react-icons/fa";
import API_BASE from "../../config/api";
import { getSocketConfig, isServerlessPlatform, createSocketConnection } from "../../utils/socketConfig";
import { pollOrders } from "../../utils/polling";
import LogoLoader from "../../components/ui/LogoLoader";
import PaymentModal from "./PaymentModal";
import TableSelectionModal from "./Tables/TableSelectionModal";

const OrderPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const cart = useAppSelector((state) => state.cart.items);
  const cartTotal = useAppSelector((state) => state.cart.total);
  const dispatch = useAppDispatch();
  const [orders, setOrders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingCartData, setPendingCartData] = useState(null);
  const [orderType, setOrderType] = useState("dine-in"); // 'dine-in' | 'parcel'
  const [tableNumber, setTableNumber] = useState("");
  const [showTableModal, setShowTableModal] = useState(false);
  const [chairsBooked, setChairsBooked] = useState(1);
  const [chairIndices, setChairIndices] = useState([]);
  const [chairLetters, setChairLetters] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const pollingStopRef = useRef(null);
  const navigate = useNavigate();

  // 🔊 Play notification sound
  const playNotificationSound = () => {
    try {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio("/notify.mp3");
        audioRef.current.volume = 0.5; // Set volume to 50%
      }
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        // Suppress autoplay errors (browser may block autoplay)
        console.warn("Could not play notification sound:", error);
      });
    } catch (error) {
      console.warn("Error playing notification sound:", error);
    }
  };

  // 🔔 Request Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // 🔔 Helper to show system notification
  const showSystemNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/pwa-192x192.png", // Standard PWA icon
          vibrate: [200, 100, 200],
        });
      } catch (e) {
        console.warn("System notification failed:", e);
      }
    }
  };

  /* ===========================
      🔌 FETCH & SOCKET SETUP
  ============================ */
  const fetchAllOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/orders`);

      // Filter user orders and exclude completed orders
      const userOrders = res.data.filter(
        (o) => (o.userId === user?.uid || o.userEmail === user?.email) && o.status !== "Completed"
      );
      setOrders(userOrders);
    } catch {
      toast.error("Couldn't load orders.");
    } finally {
      setTimeout(() => setPageLoading(false), 800);
    }
  }, [user]);

  useEffect(() => {
    // Check if we're on a serverless platform (Vercel, etc.)
    const isServerless = isServerlessPlatform();
    
    if (!socketRef.current) {
      if (isServerless) {
        // On serverless platforms, create a mock socket (no real connection)
        socketRef.current = {
          on: () => {},
          off: () => {},
          emit: () => {},
          disconnect: () => {},
          connect: () => {},
          connected: false,
          metrics: { quality: "unavailable" },
        };
      } else {
        // ✅ On regular servers, create optimized socket connection as user
        const socketConfig = getSocketConfig({
          type: "user",
          userId: user?.uid || null,
          autoConnect: true,
        });
        
        socketRef.current = createSocketConnection(API_BASE, socketConfig);
      }
    }
    const socket = socketRef.current;

    // ✅ Track socket connection status for polling fallback
    const socketConnectedRef = { current: false };
    
    // Check socket connection status
    const checkSocketConnection = () => {
      if (socket && typeof socket.connected !== 'undefined') {
        socketConnectedRef.current = socket.connected;
      }
    };
    
    // Initial check
    checkSocketConnection();
    
    // ✅ Set up polling as fallback (works on BOTH serverless AND regular servers)
    // This ensures orders update even if socket connection fails
    const fetchUserOrdersForPolling = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/orders`);
        return res.data.filter(
          (o) => (o.userId === user?.uid || o.userEmail === user?.email) && o.status !== "Completed"
        );
      } catch (error) {
        return [];
      }
    };

    // ✅ Start polling as fallback (only if socket not connected, or always on serverless)
    // Poll interval: 3s on serverless, 5s as backup on regular servers
    pollingStopRef.current = pollOrders(
      fetchUserOrdersForPolling,
      // onNewOrder callback
      (newOrder) => {
        // ✅ Only show notification if socket isn't connected (avoid duplicates)
        if (!socketConnectedRef.current) {
          toast.success(`📦 Order Placed: ${newOrder.foodName}`, {
            duration: 4000,
            position: "top-center",
          });
          showSystemNotification("Order Placed 📦", `Your order for ${newOrder.foodName} has been placed!`);
        }
        
        setOrders((prev) => {
          const exists = prev.find((o) => o._id === newOrder._id);
          if (!exists) {
            return [newOrder, ...prev];
          }
          return prev;
        });
      },
      // onStatusChange callback - CRITICAL for real-time status updates
      (updatedOrder, oldOrder) => {
        // ✅ Validate order belongs to user
        if (!updatedOrder || !updatedOrder._id || !user) return;
        
        const isUserOrder = 
          (updatedOrder.userEmail === user.email) || 
          (updatedOrder.userId === user.uid);
        
        if (!isUserOrder) return;
        
        // ✅ Handle status changes (only if socket not handling it to avoid duplicates)
        if (updatedOrder.status !== oldOrder?.status) {
          if (!socketConnectedRef.current) {
            playNotificationSound();
            
            // ✅ CRITICAL: Handle Completed status - remove from live orders
            if (updatedOrder.status === "Completed") {
              setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
              toast.success(
                `🎉 Order Completed: ${updatedOrder.foodName}. View it in Order History!`,
                {
                  duration: 6000,
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
              showSystemNotification("Order Completed 🎉", `Your order for ${updatedOrder.foodName} is complete!`);
            } else {
              // ✅ Update order status for non-completed orders
              setOrders((prev) => {
                const existingIndex = prev.findIndex((o) => o._id === updatedOrder._id);
                if (existingIndex === -1) {
                  return [updatedOrder, ...prev];
                } else {
                  const updated = [...prev];
                  updated[existingIndex] = { ...updated[existingIndex], ...updatedOrder };
                  return updated;
                }
              });
              
              const statusMessages = {
                Pending: "⏳ Order Pending",
                Cooking: "👨‍🍳 Order is being cooked",
                Ready: "✅ Order is ready for pickup",
                Served: "🍽️ Order has been served",
              };
              
              toast.success(
                `${statusMessages[updatedOrder.status] || "Order status updated"}: ${updatedOrder.foodName}`,
                {
                  duration: 4000,
                  position: "top-center",
                  icon: "📦",
                  style: {
                    background: "#3b82f6",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: "600",
                  },
                }
              );
              showSystemNotification(
                "Order Update 👨‍🍳", 
                `${statusMessages[updatedOrder.status] || "Status updated"}: ${updatedOrder.foodName}`
              );
            }
          } else {
            // Socket is connected but polling detected change - still update state
            if (updatedOrder.status === "Completed") {
              setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
            } else {
              setOrders((prev) => {
                const existingIndex = prev.findIndex((o) => o._id === updatedOrder._id);
                if (existingIndex === -1) {
                  return [updatedOrder, ...prev];
                } else {
                  const updated = [...prev];
                  updated[existingIndex] = { ...updated[existingIndex], ...updatedOrder };
                  return updated;
                }
              });
            }
          }
        }

        // ✅ Handle payment status changes
        if (updatedOrder.paymentStatus !== oldOrder?.paymentStatus && updatedOrder.paymentStatus === "Paid") {
          if (!socketConnectedRef.current) {
            playNotificationSound();
            toast.success("💰 Payment Confirmed: Your payment has been confirmed by admin.", {
              duration: 5000,
              icon: '✅',
              style: {
                background: '#10b981',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
              },
              position: 'top-center',
            });
            showSystemNotification("Payment Confirmed 💰", "Your payment has been successfully confirmed.");
          }
          setOrders((prev) =>
            prev.map((o) =>
              o._id === updatedOrder._id ? { ...o, paymentStatus: "Paid", paymentMethod: updatedOrder.paymentMethod || "UPI" } : o
            )
          );
        }
      },
      isServerless ? 3000 : 5000 // Poll every 3s on serverless, 5s as backup on regular servers
    );

    // Connection event listeners
    socket.on("connect", () => {
      socketConnectedRef.current = true;
      checkSocketConnection();
      
      // ✅ CRITICAL: Identify as user after connection to join user room
      // This ensures user receives orderStatusChanged events
      if (socket && typeof socket.emit === "function" && user?.uid) {
        // Small delay to ensure socket is fully ready
        setTimeout(() => {
          socket.emit("identify", { type: "user", userId: user.uid });
        }, 100);
      }
    });

    // ✅ Listen for identification confirmation
    socket.on("identified", (data) => {
      // User successfully identified and joined user room
      if (data && data.type === "user") {
        socketConnectedRef.current = true;
      }
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        // Server disconnected the socket, try to reconnect
        socket.connect();
      }
    });

    socket.on("connect_error", (error) => {
      // Suppress error logging for expected failures - silently handle
      const errorMessage = error.message || "";
      const isExpectedError = 
        errorMessage.includes("websocket") ||
        errorMessage.includes("closed before the connection is established") ||
        errorMessage.includes("xhr poll error") ||
        API_BASE.includes("vercel.app"); // Vercel doesn't support WebSockets
      
      // Silently handle expected errors
    });

    socket.on("reconnect_attempt", () => {
      // Silently attempt reconnection
    });

    socket.on("reconnect", (attemptNumber) => {
      // Silently reconnected
    });

    socket.on("reconnect_error", (error) => {
      // Suppress reconnection errors - silently handle
      const errorMessage = error.message || "";
      // Silently handle expected errors
    });

    socket.on("reconnect_failed", () => {
      console.warn("⚠️ Socket reconnection failed. Falling back to polling or manual refresh.");
    });

    // Listen for new orders (booking) - Real-time UI update
    socket.on("newOrderPlaced", (newOrder) => {
      if (user && (newOrder.userEmail === user.email || newOrder.userId === user.uid)) {
        // Update UI immediately
        setOrders((prev) => {
          const exists = prev.find((o) => o._id === newOrder._id);
          if (!exists) {
            return [newOrder, ...prev];
          }
          return prev;
        });
        toast.success(`📦 Order Placed: ${newOrder.foodName}`, {
          duration: 4000,
          position: "top-center",
        });
        showSystemNotification("Order Placed 📦", `Your order for ${newOrder.foodName} has been placed!`);
      }
      // Also refresh to ensure consistency
      fetchAllOrders();
    });

    // Listen for status changes - Real-time UI update
    socket.on("orderStatusChanged", (updatedOrder) => {
      // ✅ CRITICAL: Verify order belongs to current user
      if (!user || !updatedOrder || !updatedOrder._id) {
        return;
      }
      
      const isUserOrder = 
        (updatedOrder.userEmail === user.email) || 
        (updatedOrder.userId === user.uid);
      
      if (!isUserOrder) {
        return; // Not user's order, ignore
      }
      
      // 🔊 Play notification sound for ALL status changes
      playNotificationSound();
      
      // ✅ CRITICAL: Handle Completed status - remove from live orders and notify
      if (updatedOrder.status === "Completed") {
        // Remove from live orders list (will appear in history)
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
        
        // ✅ Show completion notification with history suggestion
        toast.success(
          `🎉 Order Completed: ${updatedOrder.foodName}. View it in Order History!`,
          {
            duration: 6000,
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
        showSystemNotification("Order Completed 🎉", `Your order for ${updatedOrder.foodName} is complete!`);
      } else {
        // ✅ Update order status for non-completed orders
        setOrders((prev) => {
          const existingIndex = prev.findIndex((o) => o._id === updatedOrder._id);
          
          if (existingIndex === -1) {
            // Order doesn't exist in current list, add it
            return [updatedOrder, ...prev];
          } else {
            // Update existing order with latest status
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...updatedOrder };
            return updated;
          }
        });
        
        // ✅ Show status change notification
        const statusMessages = {
          Pending: "⏳ Order Pending",
          Cooking: "👨‍🍳 Order is being cooked",
          Ready: "✅ Order is ready for pickup",
          Served: "🍽️ Order has been served",
        };
        
        toast.success(
          `${statusMessages[updatedOrder.status] || "Order status updated"}: ${updatedOrder.foodName}`,
          {
            duration: 4000,
            position: "top-center",
            icon: "📦",
            style: {
              background: "#3b82f6",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
            },
          }
        );
        showSystemNotification(
          "Order Update 👨‍🍳", 
          `${statusMessages[updatedOrder.status] || "Status updated"}: ${updatedOrder.foodName}`
        );
      }
    });
    
    // Listen for payment success - Real-time UI update
    socket.on("paymentSuccess", (orderData) => {
      // Check if this order belongs to the current user
      if (user && orderData && (orderData.userId === user.uid || orderData.userEmail === user.email)) {
        // Update UI immediately
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderData._id ? { ...o, paymentStatus: "Paid" } : o
          )
        );
        toast.success("💰 Payment Done! Your payment has been confirmed by admin.", {
          duration: 5000,
          icon: '✅',
          style: {
            background: '#10b981',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
          },
          position: 'top-center',
        });
        showSystemNotification("Payment Confirmed 💰", "Your payment has been successfully confirmed.");
      }
      // Also refresh to ensure consistency
      fetchAllOrders();
    });

    return () => {
      // Clean up all event listeners
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("reconnect_attempt");
      socket.off("reconnect");
      socket.off("reconnect_error");
      socket.off("reconnect_failed");
      socket.off("newOrderPlaced");
      socket.off("orderStatusChanged");
      socket.off("paymentSuccess");
      
      // Stop polling if it's running
      if (pollingStopRef.current) {
        pollingStopRef.current();
        pollingStopRef.current = null;
      }
      
      // Don't disconnect on cleanup - let it stay connected for other components
      // if (socket.disconnect) {
      //   socket.disconnect();
      // }
    };
  }, [fetchAllOrders, user]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);


  /* ===========================
      🛒 CART LOGIC (Redux + Backend Sync)
  ============================ */
  // Calculate total (no GST)
  const total = cartTotal;

  const updateQuantity = async (id, newQty) => {
    if (!user || !user.email) {
      toast.error("Please login to update cart!");
      return;
    }

    try {
      await dispatch(
        updateQuantityAsync({
          userEmail: user.email,
          foodId: id,
          quantity: Math.max(newQty, 1),
        })
      ).unwrap();
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error("Failed to update cart. Please try again.");
    }
  };

  const removeItem = async (id) => {
    if (!user || !user.email) {
      toast.error("Please login to remove items!");
      return;
    }

    try {
      await dispatch(
        removeFromCartAsync({
          userEmail: user.email,
          foodId: id,
        })
      ).unwrap();
      toast.success("Item removed from cart 🗑️");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item. Please try again.");
    }
  };

  /* ===========================
      🧾 SUBMIT ORDER (Show Payment First)
  ============================ */
  const handleSubmit = () => {
    const isDineIn = orderType === "dine-in";

    if (!user) return toast.error("Please login first!");
    if (cart.length === 0) return toast.error("Your cart is empty!");

    // ✅ Dine-in validation: require table selection
    if (isDineIn) {
      if (!tableNumber) {
        toast.error("Please select a table for Dine-in orders");
        return;
      }
    } else {
      // ✅ Parcel / Delivery validation: require phone number
      if (!contactNumber.trim()) {
        toast.error("Please enter your phone number for parcel/delivery orders");
        return;
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(contactNumber.trim())) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }
    }

    // Store cart data for payment modal (include table selection and phone number)
    setPendingCartData({
      cart,
      user,
      tableNumber: isDineIn && tableNumber ? Number(tableNumber) : 0,
      chairsBooked: isDineIn && tableNumber ? chairsBooked : 0,
      chairIndices: isDineIn && tableNumber ? chairIndices : [],
      chairLetters: isDineIn && tableNumber ? chairLetters : "",
      contactNumber: !isDineIn ? contactNumber.trim() : "",
    });

    // Show payment modal FIRST (before creating orders)
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async () => {
    // Clear cart from backend and reset after payment is completed
    if (user && user.email) {
      try {
        await dispatch(clearCartAsync(user.email)).unwrap();
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
    setShowPaymentModal(false);
    setPendingCartData(null);
    fetchAllOrders();
  };


  /* ===========================
      🧭 UI
  ============================ */
  if (pageLoading) return <LogoLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff8f3] to-white py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-10 mt-10 pb-20">
      <Toaster />


      {/* ===== CART SECTION ===== */}
      {cart.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500 mt-12 sm:mt-20"
        >
          <p className="text-base sm:text-lg md:text-xl">Your cart is empty 🍽️</p>
          <button
            onClick={() => navigate("/menu")}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-5 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base"
          >
            Browse Menu
          </button>
        </motion.div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
          {/* 🧺 Cart Items */}
          <div className="lg:col-span-2 bg-white shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full">
            {cart.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 py-3 sm:py-4 gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <img
                    src={item.image || "https://via.placeholder.com/100"}
                    alt={item.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">
                      {item.name}
                      {item.selectedSize && (
                        <span className="ml-2 text-xs sm:text-sm text-orange-600 font-semibold">
                          ({item.selectedSize})
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm capitalize">
                      {item.category} • {item.type}
                    </p>
                    <p className="text-red-600 font-bold mt-1 text-sm sm:text-base">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-200 rounded-full font-bold text-base sm:text-lg hover:bg-gray-300 transition"
                    >
                      −
                    </button>
                    <span className="text-gray-700 font-semibold text-sm sm:text-base w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-200 rounded-full font-bold text-base sm:text-lg hover:bg-gray-300 transition"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item._id)}
                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm flex items-center gap-1"
                  >
                    <FaTrashAlt /> <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 💳 Bill Summary */}
          <div className="bg-white shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:sticky lg:top-10 h-fit">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Bill Summary</h3>

            {/* Order Type Selection */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Order Type</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("dine-in");
                    setContactNumber("");
                  }}
                  className={`px-3 py-1.5 rounded-full border-2 text-xs sm:text-sm font-semibold transition-all ${
                    orderType === "dine-in"
                      ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                      : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Dine-in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("parcel");
                    // Clear table selection when switching to parcel
                    setTableNumber("");
                    setChairsBooked(1);
                    setChairIndices([]);
                    setChairLetters("");
                  }}
                  className={`px-3 py-1.5 rounded-full border-2 text-xs sm:text-sm font-semibold transition-all ${
                    orderType === "parcel"
                      ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                      : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Parcel
                </button>
              </div>
            </div>

            {/* Table Selection - Only for Dine-in */}
            {orderType === "dine-in" && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Table
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTableModal(true)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                      tableNumber
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <FaChair className="text-sm" />
                    <span className="font-medium">
                      {tableNumber 
                        ? `Table ${tableNumber}${chairLetters ? ` (${chairLetters})` : ` (${chairsBooked} seat${chairsBooked > 1 ? "s" : ""})`}` 
                        : "Select Table"}
                    </span>
                  </button>
                  {tableNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        setTableNumber("");
                        setChairsBooked(1);
                        setChairIndices([]);
                        setChairLetters("");
                      }}
                      className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Clear table selection"
                    >
                      <FaTrashAlt className="text-sm" />
                    </button>
                  )}
                </div>
                {!tableNumber && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Table selection is required for Dine-in orders
                  </p>
                )}
              </div>
            )}

            {/* Phone Number Input - Only for Parcel/Delivery */}
            {orderType === "parcel" && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => {
                    // Only allow numbers and limit to 10 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setContactNumber(value);
                  }}
                  placeholder="Enter 10-digit phone number"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  📞 Required for parcel/delivery orders
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-800 text-base sm:text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!user}
              className="w-full mt-4 sm:mt-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2.5 sm:py-3 rounded-full font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FaShoppingBag /> Place Order
            </motion.button>
          </div>
        </div>
      )}

      {/* ===== LIVE ORDERS SECTION ===== */}
      {orders.length > 0 && (
        <div className="mt-8 sm:mt-12 md:mt-16 max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 text-gray-800 px-2">Your Live Orders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {orders.map((order) => {
              return (
                <div
                  key={order._id}
                  className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow hover:shadow-md transition"
                >
                  <h4 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">
                    {order.foodName}
                    {order.selectedSize && (
                      <span className="ml-2 text-xs sm:text-sm text-orange-600 font-semibold">
                        ({order.selectedSize})
                      </span>
                    )}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 capitalize">
                    {order.category} • {order.type}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-medium text-red-600 text-sm sm:text-base">
                      ₹{Number(order.price).toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-semibold">
                      Qty: {order.quantity || 1}
                    </p>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm">
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        order.status === "Pending"
                          ? "text-yellow-600"
                          : order.status === "Cooking"
                          ? "text-blue-600"
                          : order.status === "Ready"
                          ? "text-purple-600"
                          : order.status === "Served"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </p>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {pendingCartData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPendingCartData(null);
          }}
          cartData={pendingCartData.cart}
          totalAmount={total}
          user={pendingCartData.user}
          socketRef={socketRef}
          onPaymentComplete={handlePaymentComplete}
          tableNumber={pendingCartData.tableNumber}
          chairsBooked={pendingCartData.chairsBooked}
          chairIndices={pendingCartData.chairIndices}
          chairLetters={pendingCartData.chairLetters}
          contactNumber={pendingCartData.contactNumber}
        />
      )}

      {/* Table Selection Modal */}
      <TableSelectionModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        availableTables={[]}
        onChairsSelected={(chairData) => {
          if (chairData && typeof chairData === 'object') {
            setChairsBooked(chairData.count || 1);
            setChairIndices(chairData.indices || []);
            setChairLetters(chairData.letters || "");
          } else {
            // Fallback for old format (just count)
            setChairsBooked(chairData || 1);
          }
        }}
      />
    </div>
  );
};

export default OrderPage;
