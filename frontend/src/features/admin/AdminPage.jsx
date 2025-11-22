import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import API_BASE from "../../config/api";
import { getSocketConfig, isServerlessPlatform, createSocketConnection } from "../../utils/socketConfig";
import { pollOrders } from "../../utils/polling";
import LogoLoader from "../../components/ui/LogoLoader";
import TotalSales from "./TotalSales";
import AdminOrderHistory from "./AdminOrderHistory";
import { useFoodFilter } from "../../store/hooks";
import {
  AdminTabs,
  OrdersSection,
  FoodListSection,
  AddFoodForm,
} from "./AdminComponents";

const AdminPage = () => {
  const { filterFoods: applyGlobalFilter } = useFoodFilter();
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [foodForm, setFoodForm] = useState({
    name: "",
    category: "",
    type: "",
    price: "",
    available: true,
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [highlightedOrder, setHighlightedOrder] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const pollingStopRef = useRef(null);
  const directPollingIntervalRef = useRef(null);
  const socketConnectionTimeoutRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);
  const maxConsecutiveErrors = 5; // Stop polling after 5 consecutive errors

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

  /* ================================
     🔌 Socket.IO + Fetch Data
  ================================ */
  const getAllData = async () => {
    try {
      const [foodsRes, ordersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/foods`),
        axios.get(`${API_BASE}/api/orders`),
      ]);
      setFoods(foodsRes.data);
      // Filter out completed orders from active orders view
      const activeOrders = ordersRes.data.filter((o) => o.status !== "Completed");
      setOrders(activeOrders);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setTimeout(() => setPageLoading(false), 800);
    }
  };

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
        // ✅ On regular servers, create optimized socket connection as admin
        const socketConfig = getSocketConfig({
          type: "admin",
          userId: null,
          autoConnect: true,
        });
        
        socketRef.current = createSocketConnection(API_BASE, socketConfig);
      }
    }
    const socket = socketRef.current;
    getAllData();

    // ⚡ CRITICAL FIX: Set up aggressive polling that ALWAYS runs
    // This ensures real-time updates regardless of socket status
    const fetchOrdersForPolling = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/orders`, {
          timeout: 5000, // 5s timeout
        });
        consecutiveErrorsRef.current = 0; // Reset error count on success
        const activeOrders = res.data.filter((o) => o.status !== "Completed");
        return activeOrders;
      } catch (error) {
        consecutiveErrorsRef.current += 1;
        
        // ⚡ Only log unexpected errors (not 503, timeout, or network errors)
        const isExpectedError = 
          error?.response?.status === 503 || // Service unavailable
          error?.code === 'ECONNABORTED' || // Timeout
          error?.code === 'ERR_NETWORK' || // Network error
          error?.message?.includes('timeout') ||
          error?.message?.includes('Network Error');
        
        if (!isExpectedError && consecutiveErrorsRef.current <= 3) {
          // Only log first 3 unexpected errors to avoid spam
          console.warn("Error fetching orders for polling:", error?.message || error);
        }
        
        // ⚡ Circuit breaker: Stop polling if too many consecutive errors
        if (consecutiveErrorsRef.current >= maxConsecutiveErrors) {
          if (directPollingIntervalRef.current) {
            clearInterval(directPollingIntervalRef.current);
            directPollingIntervalRef.current = null;
          }
          toast.error("Unable to fetch orders. Server may be unavailable.", {
            duration: 5000,
            position: "top-right",
          });
          return [];
        }
        
        return [];
      }
    };

    // ⚡ Track socket connection status (but don't let it block polling)
    const socketConnectedRef = { current: false };

    // ⚡ Check socket connection status
    const checkSocketConnection = () => {
      if (socket && typeof socket.connected !== 'undefined') {
        socketConnectedRef.current = socket.connected;
      }
    };

    // Initial check
    checkSocketConnection();

    // ⚡ CRITICAL: Always use polling as primary mechanism for admin
    // Socket connections are unreliable on serverless platforms
    // Polling ensures we ALWAYS get real-time updates
    const shouldUsePollingAsPrimary = true; // Always use polling for admin
    const pollingInterval = 1500; // ⚡ Fast 1.5s polling for near real-time feel
    
    // ⚡ Set up a direct polling mechanism that syncs ALL orders
    const syncOrdersFromPolling = async () => {
      try {
        const freshOrders = await fetchOrdersForPolling();
        
        // ⚡ Skip if no orders (likely an error)
        if (!Array.isArray(freshOrders) || freshOrders.length === 0) {
          return;
        }
        
        const currentOrderIds = new Set(freshOrders.map(o => o._id));
        
        // ⚡ Always update orders state with fresh data
        setOrders((prev) => {
          // Check if there are new orders
          const prevOrderIds = new Set(prev.map(o => o._id));
          
          // Find new orders
          const newOrders = freshOrders.filter(o => !prevOrderIds.has(o._id));
          
          // ⚡ FIX: Handle notifications OUTSIDE setState to avoid React warning
          // Store new orders for processing after state update
          if (newOrders.length > 0) {
            // Use setTimeout to defer notifications outside render cycle
            setTimeout(() => {
              newOrders.forEach(newOrder => {
                if (newOrder && newOrder._id) {
                  playNotificationSound();
                  // Show "Delivery" if isInRestaurant is false, otherwise show "Dine-in" with table number
                  let orderType = newOrder.isInRestaurant === false 
                    ? "🚚 Delivery" 
                    : `🍽️ Dine-in - Table ${newOrder.tableNumber}`;
                  
                  // Add delivery info if available
                  if (newOrder.isInRestaurant === false) {
                    if (newOrder.contactNumber) {
                      orderType += ` | 📞 ${newOrder.contactNumber}`;
                    }
                    if (newOrder.deliveryLocation?.address) {
                      orderType += ` | 📍 ${newOrder.deliveryLocation.address.substring(0, 30)}...`;
                    }
                  }
                  
                  toast.success(`📦 New Order: ${newOrder.foodName} - ${orderType}`, {
                    duration: 5000,
                    position: "top-right",
                    icon: "🆕",
                    style: {
                      background: "#10b981",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: "600",
                    },
                  });
                  setHighlightedOrder(newOrder._id);
                  setTimeout(() => setHighlightedOrder(null), 3000);
                }
              });
            }, 0);
          }
          
          // Check for status changes
          freshOrders.forEach(newOrder => {
            const oldOrder = prev.find(o => o._id === newOrder._id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
              // Use setTimeout to defer notifications outside render cycle
              setTimeout(() => {
                playNotificationSound();
                const statusMessages = {
                  Pending: "⏳ Order status: Pending",
                  Cooking: "👨‍🍳 Order is being cooked",
                  Ready: "✅ Order is ready",
                  Served: "🍽️ Order has been served",
                  Completed: "🎉 Order completed",
                };
                toast.success(
                  `${statusMessages[newOrder.status] || "Order status updated"}: ${newOrder.foodName}`,
                  {
                    duration: 4000,
                    position: "top-right",
                    style: {
                      background: "#3b82f6",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: "600",
                    },
                  }
                );
              }, 0);
            }
            
            // Check payment status changes
            if (oldOrder && oldOrder.paymentStatus !== newOrder.paymentStatus && newOrder.paymentStatus === "Paid") {
              setTimeout(() => {
                playNotificationSound();
                toast.success(`💰 Payment Confirmed: ${newOrder.foodName}`, {
                  duration: 4000,
                  position: "top-right",
                  icon: "✅",
                  style: {
                    background: "#10b981",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: "600",
                  },
                });
              }, 0);
            }
          });
          
          // ⚡ Always return fresh orders list (ensures UI is always in sync)
          return freshOrders;
        });
        
      } catch (error) {
        // Silent error handling - don't spam console
        consecutiveErrorsRef.current += 1;
      }
    };
    
    // ⚡ Start aggressive polling immediately
    syncOrdersFromPolling(); // Initial fetch
    directPollingIntervalRef.current = setInterval(syncOrdersFromPolling, pollingInterval);
    
    // ⚡ Also use the existing pollOrders for additional change detection
    pollingStopRef.current = pollOrders(
      fetchOrdersForPolling,
      // onNewOrder callback
      (newOrder) => {
        if (!newOrder || !newOrder._id) return;
        
        // ⚡ Always update state (polling is primary mechanism)
        setOrders((prev) => {
          const existingIndex = prev.findIndex((o) => o._id === newOrder._id);
          
          if (newOrder.status !== "Completed") {
            if (existingIndex === -1) {
              // ⚡ FIX: Move setState outside to avoid React warning
              setTimeout(() => {
                setHighlightedOrder(newOrder._id);
                setTimeout(() => setHighlightedOrder(null), 3000);
              }, 0);
              return [newOrder, ...prev];
            } else {
              const updated = [...prev];
              updated[existingIndex] = { ...updated[existingIndex], ...newOrder };
              return updated;
            }
          }
          
          if (existingIndex !== -1) {
            return prev.filter((o) => o._id !== newOrder._id);
          }
          
          return prev;
        });
      },
      // onStatusChange callback
      (updatedOrder, oldOrder) => {
        if (updatedOrder.status !== oldOrder?.status) {
          if (updatedOrder.status === "Completed") {
            setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
          } else {
            setOrders((prev) =>
              prev.map((o) =>
                o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o
              )
            );
          }
        }

        if (updatedOrder.paymentStatus !== oldOrder?.paymentStatus && updatedOrder.paymentStatus === "Paid") {
          setOrders((prev) =>
            prev.map((o) =>
              o._id === updatedOrder._id ? { ...o, paymentStatus: "Paid", paymentMethod: updatedOrder.paymentMethod || "UPI" } : o
            )
          );
        }
      },
      pollingInterval
    );

    // Connection event listeners
    socket.on("connect", () => {
      // ✅ CRITICAL: On Vercel, socket might appear "connected" but won't receive events
      // So we still consider polling as primary on serverless platforms
      if (!isServerless) {
        socketConnectedRef.current = true;
        checkSocketConnection();
        
        // ✅ CRITICAL: Identify as admin immediately after connection
        // This ensures admin joins "admins" room and receives newOrderPlaced events
        // The socketConfig already sends identify in auth, but we ensure it here too
        if (socket && typeof socket.emit === "function") {
          // Small delay to ensure socket is fully ready
          setTimeout(() => {
            socket.emit("identify", { type: "admin", userId: null });
          }, 100);
        }
      } else {
        // ✅ On serverless, don't trust socket connection - keep polling as primary
        // Socket.IO doesn't work reliably on Vercel, so polling handles everything
        socketConnectedRef.current = false;
      }
    });

    // ✅ Listen for identification confirmation
    socket.on("identified", (data) => {
      // Admin successfully identified and joined "admins" room
      if (data && data.type === "admin") {
        socketConnectedRef.current = true;
      }
    });

    socket.on("disconnect", (reason) => {
      socketConnectedRef.current = false;
      if (reason === "io server disconnect") {
        // Server disconnected the socket, try to reconnect
        socket.connect();
      }
    });

    socket.on("connect_error", (error) => {
      // Suppress error logging for expected failures
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
      // Suppress reconnection errors
      const errorMessage = error.message || "";
      if (!errorMessage.includes("websocket") && !errorMessage.includes("closed")) {
        console.warn("⚠️ Socket reconnection error:", error);
      }
    });

    socket.on("reconnect_failed", () => {
      console.warn("⚠️ Socket reconnection failed. Falling back to polling or manual refresh.");
    });

    socket.on("newOrderPlaced", (newOrder) => {
      // ✅ CRITICAL: Verify we received a valid order object
      if (!newOrder || !newOrder._id) {
        console.warn("⚠️ Received invalid newOrderPlaced event:", newOrder);
        return;
      }
      
      // 🔊 Play notification sound for new orders
      playNotificationSound();
      
      // Show notification toast
      // Show "Delivery" if isInRestaurant is false, otherwise show "Dine-in" with table number
      let orderType = newOrder.isInRestaurant === false 
        ? "🚚 Delivery" 
        : `🍽️ Dine-in - Table ${newOrder.tableNumber}`;
      
      // Add delivery info if available
      if (newOrder.isInRestaurant === false) {
        if (newOrder.contactNumber) {
          orderType += ` | 📞 ${newOrder.contactNumber}`;
        }
        if (newOrder.deliveryLocation?.address) {
          orderType += ` | 📍 ${newOrder.deliveryLocation.address.substring(0, 30)}...`;
        }
      }
      
      toast.success(`📦 New Order: ${newOrder.foodName} - ${orderType}`, {
        duration: 5000,
        position: "top-right",
        icon: "🆕",
        style: {
          background: "#10b981",
          color: "#fff",
          fontSize: "16px",
          fontWeight: "600",
        },
      });
      
      // ✅ CRITICAL: Always add/update order if it's not completed
      // Use functional update to avoid stale state issues
      if (newOrder.status !== "Completed") {
        setOrders((prev) => {
          // Find if order already exists
          const existingIndex = prev.findIndex((o) => o._id === newOrder._id);
          
          if (existingIndex === -1) {
            // New order - add to beginning of array
            // Highlight the new order
            setHighlightedOrder(newOrder._id);
            setTimeout(() => setHighlightedOrder(null), 3000);
            return [newOrder, ...prev];
          } else {
            // Order exists but might be outdated - update it with latest data
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...newOrder };
            return updated;
          }
        });
      }
    });

    // Listen for order deletion events
    socket.on("orderDeleted", (deletedOrderId) => {
      if (!deletedOrderId) return;
      
      // Remove deleted order from state immediately
      setOrders((prev) => prev.filter((order) => order._id !== deletedOrderId));
      
      // Clear highlight if deleted order was highlighted
      if (highlightedOrder === deletedOrderId) {
        setHighlightedOrder(null);
      }
    });

    socket.on("orderStatusChanged", (updatedOrder) => {
      const statusMessages = {
        Pending: "⏳ Order status: Pending",
        Cooking: "👨‍🍳 Order is being cooked",
        Ready: "✅ Order is ready",
        Served: "🍽️ Order has been served",
        Completed: "🎉 Order completed",
      };
      
      // 🔊 Play notification sound for status changes
      playNotificationSound();
      
      // Show notification toast
      toast.success(
        `${statusMessages[updatedOrder.status] || "Order status updated"}: ${updatedOrder.foodName}`,
        {
          duration: 4000,
          position: "top-right",
          style: {
            background: "#3b82f6",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
          },
        }
      );
      
      // If order is completed, remove it from active orders view
      if (updatedOrder.status === "Completed") {
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
      } else {
        // Update order status if not completed
        setOrders((prev) =>
          prev.map((o) =>
            o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o
          )
        );
      }
      
      // Don't call getAllData() here - state is already updated above
      // This prevents duplicate notifications
    });

    socket.on("paymentSuccess", (orderData) => {
      
      // 🔊 Play notification sound for payment
      playNotificationSound();
      
      // Show notification toast
      toast.success(`💰 Payment Confirmed: ${orderData.foodName}`, {
        duration: 4000,
        position: "top-right",
        icon: "✅",
        style: {
          background: "#10b981",
          color: "#fff",
          fontSize: "16px",
          fontWeight: "600",
        },
      });
      
      // Update order payment status
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderData._id ? { ...o, paymentStatus: "Paid", paymentMethod: orderData.paymentMethod || "UPI" } : o
        )
      );
      
      // Don't call getAllData() here - state is already updated above
      // This prevents duplicate notifications
    });

    socket.on("foodUpdated", (updatedFood) => {
      // ✅ Only show notification if status actually changed (prevents duplicate from own actions)
      setFoods((prev) => {
        const existingFood = prev.find((f) => f._id === updatedFood._id);
        // Only show notification if availability status changed (not from our own update)
        if (existingFood && existingFood.available !== updatedFood.available) {
          playNotificationSound();
          toast.success(`🍽️ Food Updated: ${updatedFood.name}`, {
            duration: 3000,
            position: "top-right",
            icon: "✅",
            style: {
              background: "#3b82f6",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
            },
          });
        }
        return prev.map((f) => (f._id === updatedFood._id ? updatedFood : f));
      });
      
      // Don't call getAllData() - state is already updated above
    });

    socket.on("newFoodAdded", (food) => {
      // 🔊 Play notification sound
      playNotificationSound();
      
      toast.success(`➕ New Food Added: ${food.name}`, {
        duration: 3000,
        position: "top-right",
        icon: "🆕",
        style: {
          background: "#10b981",
          color: "#fff",
          fontSize: "16px",
          fontWeight: "600",
        },
      });
      
      setFoods((prev) => {
        const exists = prev.find((f) => f._id === food._id);
        if (!exists) {
          return [food, ...prev];
        }
        return prev;
      });
      
      // Don't call getAllData() - state is already updated above
    });
    
    socket.on("foodDeleted", (id) => {
      // 🔊 Play notification sound
      playNotificationSound();
      
      toast.success("🗑️ Food Deleted", {
        duration: 3000,
        position: "top-right",
        icon: "🗑️",
        style: {
          background: "#ef4444",
          color: "#fff",
          fontSize: "16px",
          fontWeight: "600",
        },
      });
      
      setFoods((prev) => prev.filter((f) => f._id !== id));
      
      // Don't call getAllData() - state is already updated above
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
      socket.off("orderDeleted");
      socket.off("paymentSuccess");
      socket.off("foodUpdated");
      socket.off("newFoodAdded");
      socket.off("foodDeleted");
      
      // ⚡ Stop all polling mechanisms
      if (pollingStopRef.current) {
        // Stop the pollOrders mechanism
        if (typeof pollingStopRef.current === 'function') {
          pollingStopRef.current();
        }
        pollingStopRef.current = null;
      }
      
      // ⚡ Clear direct polling interval
      if (directPollingIntervalRef.current) {
        clearInterval(directPollingIntervalRef.current);
        directPollingIntervalRef.current = null;
      }
      
      // Clear socket connection timeout if it exists
      if (socketConnectionTimeoutRef.current) {
        clearTimeout(socketConnectionTimeoutRef.current);
        socketConnectionTimeoutRef.current = null;
      }
      
      // Don't disconnect on cleanup - let it stay connected for other components
      // if (socket.disconnect) {
      //   socket.disconnect();
      // }
    };
  }, []);

  /* ================================
     🍛 Food CRUD
  ================================ */
  const handleChange = (e) =>
    setFoodForm({ ...foodForm, [e.target.name]: e.target.value });

  const handleImageFile = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const originalSize = file.size;
    setCompressing(true);
    setCompressionInfo(null);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);
      const compressedSize = compressedFile.size;
      const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

      setImage(compressedFile);
      setPreview(URL.createObjectURL(compressedFile));
      setCompressionInfo({
        original: (originalSize / 1024 / 1024).toFixed(2),
        compressed: (compressedSize / 1024 / 1024).toFixed(2),
        reduction: reduction,
      });

      if (reduction > 0) {
        toast.success(`✅ Image compressed! Size reduced by ${reduction}%`, {
          duration: 3000,
        });
      } else {
        toast.success("✅ Image ready!", { duration: 2000 });
      }
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to compress image. Using original file.");
      setImage(file);
      setPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageFile(file);
    }
  };

  // Handlers for AddFoodForm component
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setImage(null);
    setCompressionInfo(null);
  };

  const saveFood = async () => {
    try {
      const formData = new FormData();
      Object.entries(foodForm).forEach(([key, val]) => formData.append(key, val));
      if (image) formData.append("image", image);

      let res;
      if (editMode) {
        res = await axios.put(`${API_BASE}/api/foods/${editId}`, formData);
        toast.success("✅ Food updated successfully!");
      } else {
        res = await axios.post(`${API_BASE}/api/foods/add`, formData);
        toast.success("✅ Food added successfully!");
      }

      socketRef.current.emit("foodUpdated", res.data.food || res.data);
      resetForm();
      getAllData();
    } catch {
      toast.error("Failed to save food.");
    }
  };

  const resetForm = () => {
    setFoodForm({
      name: "",
      category: "",
      type: "",
      price: "",
      available: true,
    });
    setImage(null);
    setPreview(null);
    setCompressing(false);
    setCompressionInfo(null);
    setEditMode(false);
    setEditId(null);
  };

  const editFood = (food) => {
    setFoodForm({
      name: food.name,
      category: food.category,
      type: food.type,
      price: food.price,
      available: food.available,
    });
    setPreview(food.image || null);
    setEditMode(true);
    setEditId(food._id);
    setActiveTab("addFood");
  };

  const deleteFood = async (id) => {
    if (!window.confirm("❗Are you sure you want to delete this food item?")) return;
    try {
      await axios.delete(`${API_BASE}/api/foods/${id}`);
      toast.success("🗑️ Food deleted successfully!");
      getAllData();
    } catch {
      toast.error("Failed to delete food.");
    }
  };

  const toggleAvailability = async (id, available) => {
    try {
      const res = await axios.put(`${API_BASE}/api/foods/${id}`, { available });
      const updatedFood = res.data.food || res.data;
      setFoods((prev) =>
        prev.map((f) =>
          f._id === id ? { ...f, available: updatedFood.available } : f
        )
      );
      socketRef.current.emit("foodUpdated", updatedFood);
      toast.success(
        `${updatedFood.name} is now ${
          updatedFood.available ? "Available ✅" : "Out of Stock ❌"
        }`
      );
    } catch {
      toast.error("Failed to update availability");
    }
  };

  /* ================================
     🧾 Orders Logic
  ================================ */
  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(`${API_BASE}/api/orders/${id}`, { status });
      socketRef.current.emit("orderUpdated", res.data);
      
      // 🔊 Play notification sound when admin updates order status
      playNotificationSound();
      
      toast(`Order marked as "${status}"`, { icon: "✅" });
      getAllData();
    } catch {
      toast.error("Failed to update order");
    }
  };

  const markPaymentSuccess = async (id) => {
    try {
      const res = await axios.put(`${API_BASE}/api/orders/${id}`, {
        paymentStatus: "Paid",
      });
      
      // Socket event is already emitted by backend in updateOrderStatus
      // No need to emit again from frontend
      
      toast.success("💰 Payment Successful!");
      getAllData();
    } catch (error) {
      console.error("Error marking payment:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to mark payment successful";
      toast.error(errorMessage);
    }
  };

  const deleteOrder = async (id) => {
    // Find the order to show details in confirmation
    const orderToDelete = orders.find(o => o._id === id);
    const orderDetails = orderToDelete 
      ? `${orderToDelete.foodName} (${orderToDelete.status})`
      : "this order";
    
    // Better confirmation dialog
    const confirmed = window.confirm(
      `🗑️ Are you sure you want to delete ${orderDetails}?\n\n` +
      `This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      // Add admin flag to request header
      await axios.delete(`${API_BASE}/api/orders/${id}`, {
        headers: {
          'x-admin-request': 'true'
        },
        params: {
          admin: 'true'
        }
      });
      
      toast.success("🗑️ Order deleted successfully!", {
        duration: 3000,
        icon: "✅",
      });
      
      // Remove from local state immediately for better UX
      setOrders(prevOrders => prevOrders.filter(order => order._id !== id));
      
      // Refresh data to ensure sync
      getAllData();
    } catch (error) {
      console.error("Error deleting order:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete order.";
      toast.error(errorMessage, {
        duration: 4000,
        icon: "❌",
      });
    }
  };

  const groupedOrders = orders.reduce((acc, order) => {
    const key = order.userEmail || "Unknown User";
    if (!acc[key]) {
      acc[key] = {
        userName: order.userName || "Guest User",
        userEmail: order.userEmail || "N/A",
        items: [],
      };
    }
    acc[key].items.push(order);
    return acc;
  }, {});

  if (pageLoading) return <LogoLoader />;

  /* ================================
     🧭 UI Layout
  ================================ */
  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full bg-gradient-to-b from-yellow-50 to-white min-h-screen pb-30 md:pb-6 mt-12">
      <Toaster />
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-red-700 text-center">
        👨‍🍳 Admin Dashboard
      </h2>

      {/* 🧭 Tabs */}
      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <AnimatePresence mode="wait">
        {/* 🧾 Orders Tab */}
        {activeTab === "orders" && (
          <OrdersSection
            groupedOrders={groupedOrders}
            highlightedOrder={highlightedOrder}
            onStatusChange={updateStatus}
            onMarkPayment={markPaymentSuccess}
            onDeleteOrder={deleteOrder}
          />
        )}

        {/* 🍽️ Food List Tab */}
        {/* 📜 Order History Tab */}
        {activeTab === "history" && <AdminOrderHistory />}

        {activeTab === "foods" && (
          <FoodListSection
            foods={foods}
            filteredFoods={applyGlobalFilter(foods)}
            onEdit={editFood}
            onDelete={deleteFood}
            onToggleAvailability={toggleAvailability}
          />
        )}

        {/* ➕ Add Food Tab */}
        {activeTab === "addFood" && (
          <AddFoodForm
            foodForm={foodForm}
            editMode={editMode}
            preview={preview}
            compressing={compressing}
            compressionInfo={compressionInfo}
            isDragging={isDragging}
            onFormChange={handleChange}
            onImageChange={handleImageChange}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onRemoveImage={handleRemoveImage}
            onSave={saveFood}
            onReset={resetForm}
          />
        )}

        {/* 💰 Total Sales */}
        {activeTab === "sales" && <TotalSales />}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
