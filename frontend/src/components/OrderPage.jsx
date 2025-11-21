import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useAppSelector } from "../store/hooks";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaShoppingBag, FaStore, FaHome } from "react-icons/fa";
import API_BASE from "../config/api";
import { getSocketConfig, isServerlessPlatform } from "../utils/socketConfig";
import LogoLoader from "./LogoLoader";
import TableSelect from "./OrderPage/Tables/TableSelect";
import PaymentModal from "./OrderPage/PaymentModal";

const TOTAL_TABLES = 40;

const OrderPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [bookedTables, setBookedTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [selectedChairsCount, setSelectedChairsCount] = useState(1);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingCartData, setPendingCartData] = useState(null);
  const [isInRestaurant, setIsInRestaurant] = useState(true); // Toggle for in/out restaurant
  const socketRef = useRef(null);
  const audioRef = useRef(null);
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

  /* ===========================
      🔌 FETCH & SOCKET SETUP
  ============================ */
  const fetchAllOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/orders`);
      const booked = res.data
        .filter((o) => o.status !== "Completed")
        .map((o) => Number(o.tableNumber));
      setBookedTables([...new Set(booked)]);

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
        };
      } else {
        // On regular servers, create real socket connection
        try {
          const socketConfig = getSocketConfig();
          socketRef.current = io(API_BASE, socketConfig);
        } catch (error) {
          // Create a mock socket object to prevent errors
          socketRef.current = {
            on: () => {},
            off: () => {},
            emit: () => {},
            disconnect: () => {},
            connect: () => {},
            connected: false,
          };
        }
      }
    }
    const socket = socketRef.current;

    // Connection event listeners for debugging
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        // Server disconnected the socket, try to reconnect
        socket.connect();
      }
      console.log("❌ Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      // Suppress error logging for expected failures
      const errorMessage = error.message || "";
      const isExpectedError = 
        errorMessage.includes("websocket") ||
        errorMessage.includes("closed before the connection is established") ||
        errorMessage.includes("xhr poll error") ||
        API_BASE.includes("vercel.app"); // Vercel doesn't support WebSockets
      
      if (!isExpectedError) {
        console.error("❌ Socket connection error:", error);
      }
      // Silently handle expected errors - don't spam console
    });

    socket.on("reconnect_attempt", () => {
      console.log("🔄 Attempting to reconnect socket...");
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("✅ Socket reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_error", (error) => {
      // Suppress reconnection errors
      const errorMessage = error.message || "";
      if (!errorMessage.includes("websocket") && !errorMessage.includes("closed")) {
        console.warn("⚠️ Socket reconnection error:", error);
      }
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
        // Update booked tables
        if (newOrder.tableNumber) {
          setBookedTables((prev) => {
            if (!prev.includes(Number(newOrder.tableNumber))) {
              return [...prev, Number(newOrder.tableNumber)];
            }
            return prev;
          });
        }
        toast.success(`📦 Order Placed: ${newOrder.foodName}`, {
          duration: 4000,
          position: "top-center",
        });
      }
      // Also refresh to ensure consistency
      fetchAllOrders();
    });

    // Listen for status changes - Real-time UI update
    socket.on("orderStatusChanged", (updatedOrder) => {
      console.log("🔄 Received orderStatusChanged event:", updatedOrder);
      if (user && (updatedOrder.userEmail === user.email || updatedOrder.userId === user.uid)) {
        // 🔊 Play notification sound when order status changes
        playNotificationSound();
        
        // If order is completed, remove it from user's live orders
        if (updatedOrder.status === "Completed") {
          setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
          
          // Update booked tables if order is completed
          if (updatedOrder.tableNumber) {
            setBookedTables((prev) =>
              prev.filter((t) => t !== Number(updatedOrder.tableNumber))
            );
          }
          
          toast.success(
            `🎉 Your order is completed: ${updatedOrder.foodName}`,
            {
              duration: 4000,
              position: "top-center",
            }
          );
        } else {
          // Update order status if not completed
          setOrders((prev) =>
            prev.map((o) =>
              o._id === updatedOrder._id ? { ...o, status: updatedOrder.status } : o
            )
          );
          
          const statusMessages = {
            Pending: "⏳ Your order is pending",
            Cooking: "👨‍🍳 Your order is being cooked",
            Ready: "✅ Your order is ready",
            Served: "🍽️ Your order has been served",
          };
          toast.success(
            `${statusMessages[updatedOrder.status] || "Order status updated"}: ${updatedOrder.foodName}`,
            {
              duration: 4000,
              position: "top-center",
            }
          );
        }
      }
      // Also refresh to ensure consistency
      fetchAllOrders();
    });
    
    // Listen for payment success - Real-time UI update
    socket.on("paymentSuccess", (orderData) => {
      console.log("💰 Received paymentSuccess event:", orderData);
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
      🛒 CART LOGIC
  ============================ */
  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    if (saved) {
      const parsed = JSON.parse(saved);
      setCart(parsed);
      calculateTotal(parsed);
    }
  }, []);

  const calculateTotal = (items) => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const gst = subtotal * 0.05;
    setTotal(subtotal + gst);
  };

  const updateQuantity = (id, newQty) => {
    let updated = [...cart].map((item) =>
      item._id === id ? { ...item, quantity: Math.max(newQty, 1) } : item
    );
    setCart(updated);
    localStorage.setItem("cartItems", JSON.stringify(updated));
    calculateTotal(updated);
  };

  const removeItem = (id) => {
    const updated = cart.filter((i) => i._id !== id);
    setCart(updated);
    localStorage.setItem("cartItems", JSON.stringify(updated));
    calculateTotal(updated);
    toast.success("Item removed from cart 🗑️");
  };

  /* ===========================
      🧾 SUBMIT ORDER (Show Payment First)
  ============================ */
  const handleSubmit = () => {
    if (!user) return toast.error("Please login first!");
    if (isInRestaurant && !tableNumber) return toast.error("Select a table!");
    if (cart.length === 0) return toast.error("Your cart is empty!");

    // Store cart data for payment modal
    setPendingCartData({
      cart,
      tableNumber: isInRestaurant ? tableNumber : 0, // Use 0 for takeaway/out of restaurant
      selectedChairsCount: isInRestaurant ? selectedChairsCount : 1,
      isInRestaurant, // Include the toggle state
      user,
    });

    // Show payment modal FIRST (before creating orders)
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    // Clear cart and reset after payment is completed
    setCart([]);
    localStorage.removeItem("cartItems");
    setTableNumber("");
    setSelectedChairsCount(1);
    setShowPaymentModal(false);
    setPendingCartData(null);
    fetchAllOrders();
  };


  /* ===========================
      🧭 UI
  ============================ */
  if (pageLoading) return <LogoLoader />;

  const availableTables = Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).filter(
    (n) => !bookedTables.includes(n)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff8f3] to-white py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-10 mt-10 pb-20">
      <Toaster />
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 text-center mb-6 sm:mb-8 md:mb-10"
      >
        🛒 Your Cart
      </motion.h1>

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
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* 🧺 Cart Items */}
          <div className="lg:col-span-2 bg-white shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-6">
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
                    <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">{item.name}</h3>
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

            {/* Toggle Button for In/Out Restaurant */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isInRestaurant ? (
                    <FaStore className="text-green-600 text-lg" />
                  ) : (
                    <FaHome className="text-blue-600 text-lg" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {isInRestaurant ? "In Restaurant" : "Takeaway / Delivery"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsInRestaurant(!isInRestaurant);
                    if (!isInRestaurant) {
                      // When switching to "In Restaurant", reset table selection
                      setTableNumber("");
                      setSelectedChairsCount(1);
                    } else {
                      // When switching to "Out of Restaurant", clear table
                      setTableNumber("");
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isInRestaurant ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isInRestaurant ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Table Selection - Only show when in restaurant */}
            {isInRestaurant && (
              <div className="mb-4">
                <TableSelect
                  tableNumber={tableNumber}
                  setTableNumber={setTableNumber}
                  availableTables={availableTables}
                  onChairsSelected={setSelectedChairsCount}
                />
              </div>
            )}

            <div className="flex justify-between text-gray-700 mb-2 text-sm sm:text-base">
              <span>Subtotal</span>
              <span>
                ₹
                {cart
                  .reduce((sum, i) => sum + i.price * i.quantity, 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-700 mb-2 text-sm sm:text-base">
              <span>GST (5%)</span>
              <span>
                ₹
                {(
                  cart.reduce((sum, i) => sum + i.price * i.quantity, 0) * 0.05
                ).toFixed(2)}
              </span>
            </div>
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
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 text-gray-800 px-2">📦 Your Live Orders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {orders.map((order) => {
              return (
                <div
                  key={order._id}
                  className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow hover:shadow-md transition"
                >
                  <h4 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">
                    {order.foodName}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 capitalize">
                    {order.category} • {order.type}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Table {order.tableNumber}
                  </p>
                  <p className="mt-2 font-medium text-red-600 text-sm sm:text-base">
                    ₹{Number(order.price).toFixed(2)}
                  </p>
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

                  {order.status === "Completed" && (
                    <div className="mt-3 sm:mt-4 border-t pt-3 text-center">
                      {order.paymentStatus === "Paid" ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                          <p className="text-green-600 font-semibold text-sm sm:text-base">
                            ✅ Payment Success
                          </p>
                        </div>
                      ) : (
                        <p className="text-yellow-600 font-semibold text-sm sm:text-base">
                          💳 Payment Pending
                        </p>
                      )}
                    </div>
                  )}
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
          tableNumber={pendingCartData.tableNumber}
          selectedChairsCount={pendingCartData.selectedChairsCount}
          isInRestaurant={pendingCartData.isInRestaurant}
          user={pendingCartData.user}
          socketRef={socketRef}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default OrderPage;
