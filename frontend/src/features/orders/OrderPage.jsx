import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { updateQuantityAsync, removeFromCartAsync, clearCartAsync } from "../../store/slices/cartSlice";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaShoppingBag, FaStore, FaHome } from "react-icons/fa";
import API_BASE from "../../config/api";
import { getSocketConfig, isServerlessPlatform, createSocketConnection } from "../../utils/socketConfig";
import { pollOrders } from "../../utils/polling";
import LogoLoader from "../../components/ui/LogoLoader";
import TableSelectionModal from "./Tables/TableSelectionModal";
import PaymentModal from "./PaymentModal";

const TOTAL_TABLES = 40;

const OrderPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const cart = useAppSelector((state) => state.cart.items);
  const cartTotal = useAppSelector((state) => state.cart.total);
  const dispatch = useAppDispatch();
  const [orders, setOrders] = useState([]);
  const [bookedTables, setBookedTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [selectedChairsCount, setSelectedChairsCount] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [pendingCartData, setPendingCartData] = useState(null);
  const [isInRestaurant, setIsInRestaurant] = useState(true); // Toggle for Dine-in/Delivery
  const [contactNumber, setContactNumber] = useState(""); // Contact number for delivery
  const [deliveryLocation, setDeliveryLocation] = useState(null); // Location object with lat, lng, address or just address for manual
  const [isGettingLocation, setIsGettingLocation] = useState(false); // Loading state for location
  const [locationType, setLocationType] = useState("live"); // "live" or "manual"
  const [manualLocation, setManualLocation] = useState(""); // Manual location address input
  const [locationPermission, setLocationPermission] = useState(null); // "granted", "denied", "prompt", or null
  const [showPermissionInfo, setShowPermissionInfo] = useState(false); // Show permission info modal
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
        }
        
        setOrders((prev) => {
          const exists = prev.find((o) => o._id === newOrder._id);
          if (!exists) {
            return [newOrder, ...prev];
          }
          return prev;
        });
        
        if (newOrder.tableNumber) {
          setBookedTables((prev) => {
            if (!prev.includes(Number(newOrder.tableNumber))) {
              return [...prev, Number(newOrder.tableNumber)];
            }
            return prev;
          });
        }
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
              if (updatedOrder.tableNumber) {
                setBookedTables((prev) =>
                  prev.filter((t) => t !== Number(updatedOrder.tableNumber))
                );
              }
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
        
        // Update booked tables if order is completed
        if (updatedOrder.tableNumber) {
          setBookedTables((prev) =>
            prev.filter((t) => t !== Number(updatedOrder.tableNumber))
          );
        }
        
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

  // Check initial location permission status
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query && locationType === "live") {
      navigator.permissions.query({ name: 'geolocation' })
        .then((permission) => {
          setLocationPermission(permission.state);
          
          // Listen for permission changes
          permission.onchange = () => {
            setLocationPermission(permission.state);
          };
        })
        .catch((error) => {
          console.warn("Could not check location permission:", error);
        });
    }
  }, [locationType]);

  /* ===========================
      🛒 CART LOGIC (Redux + Backend Sync)
  ============================ */
  // Calculate total with GST (cartTotal is subtotal from Redux)
  const total = cartTotal + (cartTotal * 0.05);

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
    if (!user) return toast.error("Please login first!");
    if (isInRestaurant && !tableNumber) return toast.error("Select a table!");
    if (!isInRestaurant && !contactNumber) return toast.error("Please enter your contact number!");
    if (!isInRestaurant && locationType === "live" && !deliveryLocation) {
      return toast.error("Please share your live location!");
    }
    if (!isInRestaurant && locationType === "manual" && !manualLocation.trim()) {
      return toast.error("Please enter your delivery address!");
    }
    if (cart.length === 0) return toast.error("Your cart is empty!");

    // Prepare delivery location based on type
    let finalDeliveryLocation = null;
    if (!isInRestaurant) {
      if (locationType === "live" && deliveryLocation) {
        finalDeliveryLocation = deliveryLocation;
      } else if (locationType === "manual" && manualLocation.trim()) {
        finalDeliveryLocation = {
          address: manualLocation.trim(),
          latitude: null,
          longitude: null,
        };
      }
    }

    // Store cart data for payment modal
    setPendingCartData({
      cart,
      tableNumber: isInRestaurant ? tableNumber : 0, // Use 0 for delivery orders
      selectedChairsCount: isInRestaurant ? selectedChairsCount : 1,
      isInRestaurant, // Include the toggle state
      contactNumber: !isInRestaurant ? contactNumber : "", // Include contact number for delivery
      deliveryLocation: finalDeliveryLocation, // Include location for delivery
      user,
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

            {/* Toggle Button for Dine-in/Delivery */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isInRestaurant ? (
                    <FaStore className="text-green-600 text-lg" />
                  ) : (
                    <FaHome className="text-blue-600 text-lg" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {isInRestaurant ? "Dine-in" : "Delivery"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsInRestaurant(!isInRestaurant);
                    if (!isInRestaurant) {
                      // When switching to "Dine-in", reset table selection
                      setTableNumber("");
                      setSelectedChairsCount(1);
                      // Clear delivery fields
                      setContactNumber("");
                      setDeliveryLocation(null);
                      setManualLocation("");
                      setLocationType("live");
                    } else {
                      // When switching to "Delivery", clear table
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

            {/* Table Selection - Only show when Dine-in */}
            {isInRestaurant && (
              <div className="mb-4">
                <button
                  onClick={() => setShowTableModal(true)}
                  className={`w-full py-3 px-4 rounded-full font-semibold text-base sm:text-lg transition-all ${
                    tableNumber
                      ? "bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-400 text-yellow-800"
                      : "bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-lg"
                  }`}
                >
                  {tableNumber ? (
                    <span className="flex items-center justify-center gap-2">
                      <span>✅ Table {tableNumber}</span>
                      {selectedChairsCount > 0 && (
                        <span className="text-sm">• {selectedChairsCount} seat{selectedChairsCount !== 1 ? "s" : ""}</span>
                      )}
                      <span className="text-sm opacity-75">(Click to change)</span>
                    </span>
                  ) : (
                    <span>Select Table & Seats</span>
                  )}
                </button>
              </div>
            )}

            {/* Delivery Form - Only show when Delivery is selected */}
            {!isInRestaurant && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FaHome className="text-blue-600" />
                  Delivery Information
                </h3>
                
                {/* Contact Number Input */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="Enter your contact number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Delivery Location - Live or Manual */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Location <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Location Type Selector */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setLocationType("live");
                        setManualLocation("");
                        // Keep deliveryLocation if it exists, otherwise clear it
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                        locationType === "live"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      📍 Live Location
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocationType("manual");
                        setDeliveryLocation(null);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                        locationType === "manual"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      ✏️ Manual Entry
                    </button>
                  </div>

                  {/* Live Location Option */}
                  {locationType === "live" && (
                    <div>
                      {/* Permission Info Banner */}
                      {!deliveryLocation && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-gray-700 mb-2">
                            <strong>📍 Location Access Required</strong>
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            We need your location to deliver your order. When you click "Share Live Location", 
                            your browser will ask for permission to access your location.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowPermissionInfo(!showPermissionInfo)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            {showPermissionInfo ? "Hide" : "Show"} instructions
                          </button>
                          {showPermissionInfo && (
                            <div className="mt-2 p-2 bg-white rounded border border-blue-100">
                              <p className="text-xs text-gray-700 font-semibold mb-1">📱 For Mobile Devices:</p>
                              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                <li>Tap "Share Live Location" button</li>
                                <li>When prompted, tap "Allow" or "Allow location access"</li>
                                <li>Make sure location/GPS is enabled in your device settings</li>
                                <li>If denied, go to browser settings and enable location permissions</li>
                              </ul>
                              <p className="text-xs text-gray-700 font-semibold mt-2 mb-1">💻 For Desktop:</p>
                              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                <li>Click "Share Live Location" button</li>
                                <li>Click "Allow" when browser asks for permission</li>
                                <li>Check browser address bar for location icon if needed</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          if (!navigator.geolocation) {
                            toast.error("Geolocation is not supported by your browser. Please use manual entry instead.");
                            return;
                          }

                          // Check if permissions API is available (modern browsers)
                          let permissionStatus = null;
                          if (navigator.permissions && navigator.permissions.query) {
                            try {
                              const permission = await navigator.permissions.query({ name: 'geolocation' });
                              permissionStatus = permission.state;
                              setLocationPermission(permissionStatus);
                              
                              // Listen for permission changes
                              permission.onchange = () => {
                                setLocationPermission(permission.state);
                              };
                            } catch (error) {
                              console.warn("Permission API not fully supported:", error);
                            }
                          }

                          // If permission was previously denied, show helpful message
                          if (permissionStatus === 'denied') {
                            toast.error(
                              "Location access was denied. Please enable location permissions in your browser settings, or use manual entry instead.",
                              { duration: 5000 }
                            );
                            return;
                          }

                          // Show permission request message
                          if (permissionStatus === 'prompt' || permissionStatus === null) {
                            toast.info(
                              "Please allow location access when prompted by your browser.",
                              { duration: 3000, icon: "📍" }
                            );
                          }
                          
                          setIsGettingLocation(true);
                          
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              const { latitude, longitude } = position.coords;
                              
                              // Try to get address from coordinates using reverse geocoding
                              let address = "";
                              try {
                                const response = await fetch(
                                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                                );
                                const data = await response.json();
                                if (data.display_name) {
                                  address = data.display_name;
                                }
                              } catch (error) {
                                console.warn("Could not fetch address:", error);
                                address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                              }
                              
                              setDeliveryLocation({
                                latitude,
                                longitude,
                                address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                              });
                              setLocationPermission('granted');
                              setIsGettingLocation(false);
                              setShowPermissionInfo(false);
                              toast.success("Location shared successfully! 📍");
                            },
                            (error) => {
                              setIsGettingLocation(false);
                              console.error("Error getting location:", error);
                              
                              // Provide specific error messages based on error code
                              let errorMessage = "Failed to get your location. ";
                              switch (error.code) {
                                case error.PERMISSION_DENIED:
                                  errorMessage += "Location access was denied. Please enable location permissions in your browser settings, or use manual entry instead.";
                                  setLocationPermission('denied');
                                  break;
                                case error.POSITION_UNAVAILABLE:
                                  errorMessage += "Location information is unavailable. Please check your device's location settings.";
                                  break;
                                case error.TIMEOUT:
                                  errorMessage += "Location request timed out. Please try again or use manual entry.";
                                  break;
                                default:
                                  errorMessage += "Please allow location access or use manual entry instead.";
                                  break;
                              }
                              
                              toast.error(errorMessage, { duration: 5000 });
                            },
                            {
                              enableHighAccuracy: true,
                              timeout: 15000, // Increased timeout for mobile devices
                              maximumAge: 0,
                            }
                          );
                        }}
                        disabled={isGettingLocation}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                          deliveryLocation
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : isGettingLocation
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : locationPermission === 'denied'
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isGettingLocation ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Requesting location access...
                          </span>
                        ) : deliveryLocation ? (
                          <span className="flex items-center justify-center gap-2">
                            ✅ Location Shared
                            <span className="text-xs">({deliveryLocation.address.substring(0, 30)}...)</span>
                          </span>
                        ) : locationPermission === 'denied' ? (
                          <span className="flex items-center justify-center gap-2">
                            ❌ Location Access Denied
                            <span className="text-xs">(Use manual entry)</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            📍 Share Live Location
                            <span className="text-xs">(Permission required)</span>
                          </span>
                        )}
                      </button>
                      
                      {/* Permission Status Indicator */}
                      {locationPermission && !deliveryLocation && (
                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs text-gray-600">
                            {locationPermission === 'granted' && "✅ Location permission granted"}
                            {locationPermission === 'denied' && "❌ Location permission denied - Please use manual entry or enable in browser settings"}
                            {locationPermission === 'prompt' && "⏳ Waiting for permission..."}
                          </p>
                        </div>
                      )}

                      {deliveryLocation && deliveryLocation.latitude && (
                        <div className="mt-2 p-2 bg-white rounded border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>Lat:</strong> {deliveryLocation.latitude.toFixed(6)},{" "}
                            <strong>Lng:</strong> {deliveryLocation.longitude.toFixed(6)}
                          </p>
                          <p className="text-xs text-gray-600">
                            <strong>Address:</strong> {deliveryLocation.address}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Location Entry */}
                  {locationType === "manual" && (
                    <div>
                      <textarea
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        placeholder="Enter your complete delivery address (e.g., House/Building number, Street, Area, City, PIN code)"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Please provide a complete address including house number, street, area, and city for accurate delivery.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between text-gray-700 mb-2 text-sm sm:text-base">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 mb-2 text-sm sm:text-base">
              <span>GST (5%)</span>
              <span>₹{(cartTotal * 0.05).toFixed(2)}</span>
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
                  {order.isInRestaurant === false ? (
                    <p className="text-xs sm:text-sm text-blue-600 font-medium">
                      🚚 Delivery
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-500">
                      🍽️ Dine-in - Table {order.tableNumber}
                    </p>
                  )}
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
          contactNumber={pendingCartData.contactNumber || ""}
          deliveryLocation={pendingCartData.deliveryLocation || null}
          user={pendingCartData.user}
          socketRef={socketRef}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Table Selection Modal */}
      <TableSelectionModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        availableTables={availableTables}
        onChairsSelected={setSelectedChairsCount}
      />
    </div>
  );
};

export default OrderPage;
