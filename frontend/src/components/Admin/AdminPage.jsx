import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import API_BASE from "../../config/api";
import { getSocketConfig, isServerlessPlatform } from "../../utils/socketConfig";
import LogoLoader from "../LogoLoader";
import TotalSales from "./TotalSales";
import AdminOrderHistory from "./AdminOrderHistory";
import { useFoodFilter } from "../../store/hooks";

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
    getAllData();

    // Connection event listeners
    socket.on("connect", () => {
      console.log("✅ Admin Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        // Server disconnected the socket, try to reconnect
        socket.connect();
      }
      console.log("❌ Admin Socket disconnected:", reason);
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
        console.error("❌ Admin Socket connection error:", error);
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

    socket.on("newOrderPlaced", (newOrder) => {
      toast.success(`📦 New Order: ${newOrder.foodName} - Table ${newOrder.tableNumber}`, {
        duration: 4000,
        position: "top-right",
        icon: "🆕",
      });
      // Only add if order is not completed
      if (newOrder.status !== "Completed") {
        setOrders((prev) => [newOrder, ...prev]);
      }
      setHighlightedOrder(newOrder._id);
      setTimeout(() => setHighlightedOrder(null), 3000);
    });

    socket.on("orderStatusChanged", (updatedOrder) => {
      const statusMessages = {
        Pending: "⏳ Order status: Pending",
        Cooking: "👨‍🍳 Order is being cooked",
        Ready: "✅ Order is ready",
        Served: "🍽️ Order has been served",
        Completed: "🎉 Order completed",
      };
      
      // 🔊 Play notification sound
      playNotificationSound();
      
      toast.success(
        `${statusMessages[updatedOrder.status] || "Order status updated"}: ${updatedOrder.foodName}`,
        {
          duration: 3000,
          position: "top-right",
        }
      );
      // If order is completed, remove it from active orders view
      if (updatedOrder.status === "Completed") {
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
      } else {
        // Update order status if not completed
        setOrders((prev) =>
          prev.map((o) =>
            o._id === updatedOrder._id ? { ...o, status: updatedOrder.status } : o
          )
        );
      }
    });

    socket.on("paymentSuccess", (orderData) => {
      console.log("💰 Admin received paymentSuccess event:", orderData);
      toast.success(`💰 Payment Confirmed: ${orderData.foodName}`, {
        duration: 3000,
        position: "top-right",
        icon: "✅",
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderData._id ? { ...o, paymentStatus: "Paid", paymentMethod: orderData.paymentMethod || "UPI" } : o
        )
      );
    });

    socket.on("foodUpdated", (updatedFood) => {
      setFoods((prev) =>
        prev.map((f) => (f._id === updatedFood._id ? updatedFood : f))
      );
    });

    socket.on("newFoodAdded", (food) => setFoods((prev) => [...prev, food]));
    socket.on("foodDeleted", (id) =>
      setFoods((prev) => prev.filter((f) => f._id !== id))
    );

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
      socket.off("foodUpdated");
      socket.off("newFoodAdded");
      socket.off("foodDeleted");
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
    if (!window.confirm("❗Delete this order permanently?")) return;
    try {
      await axios.delete(`${API_BASE}/api/orders/${id}`);
      toast.success("🗑️ Order deleted successfully!");
      getAllData();
    } catch {
      toast.error("Failed to delete order.");
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
      <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 sm:gap-2">
          {[
            { id: "orders", label: "🧾 Orders", shortLabel: "🧾" },
            { id: "history", label: "📜 History", shortLabel: "📜" },
            { id: "foods", label: "🍽️ Food List", shortLabel: "🍽️" },
            { id: "addFood", label: "➕ Add Food", shortLabel: "➕" },
            { id: "sales", label: "💰 Total Sales", shortLabel: "💰" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-red-600"
                  : "text-gray-500 hover:text-red-400"
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* 🧾 Orders Tab */}
        {activeTab === "orders" && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="bg-white shadow-lg rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6"
          >
            <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-3 sm:mb-4">
              🧾 Orders Grouped by User
            </h3>

            {Object.keys(groupedOrders).length === 0 ? (
              <p className="text-gray-500 text-sm sm:text-base">No active orders.</p>
            ) : (
              Object.values(groupedOrders).map((userGroup, idx) => (
                <div key={idx} className="mb-6 sm:mb-8 border-b pb-4 sm:pb-5">
                  <h4 className="text-base sm:text-lg font-bold text-red-700 mb-1 sm:mb-2">
                    👤 {userGroup.userName}
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3 break-all">
                    📧 {userGroup.userEmail}
                  </p>

                  {userGroup.items.map((order) => (
                    <div
                      key={order._id}
                      className={`border rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 transition-all ${
                        highlightedOrder === order._id
                          ? "bg-yellow-100"
                          : "bg-gray-50"
                      }`}
                    >
                      {/* Username Badge - Prominent Display */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                        <span className="text-xs sm:text-sm font-bold text-blue-700 bg-gradient-to-r from-blue-100 to-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm border border-blue-200 inline-block">
                          👤 {order.userName || userGroup.userName || "Guest User"}
                        </span>
                        <span className="text-xs text-gray-500 break-all">
                          📧 {order.userEmail || userGroup.userEmail}
                        </span>
                      </div>
                      
                      <p className="font-semibold text-gray-800 text-sm sm:text-base mb-1">
                        <span className={order.isInRestaurant === false ? "text-blue-600" : "text-green-600"}>
                          {order.isInRestaurant === false ? "🚚 Delivery" : "🏪 Restaurant"}
                        </span>
                        {order.isInRestaurant === true && ` - Table ${order.tableNumber}`}: {order.foodName} ({order.type})
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        Qty: {order.quantity} • ₹{order.price} •{" "}
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
                              : "text-gray-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {order.paymentStatus === "Paid" ? (
                          <div className="flex items-center gap-2">
                            <p className="text-green-600 font-semibold text-xs sm:text-sm">
                              ✅ Payment Paid
                            </p>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              order.paymentMethod === "Cash" 
                                ? "bg-yellow-100 text-yellow-700" 
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {order.paymentMethod === "Cash" ? "💵 Cash" : "📱 UPI"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-red-600 font-semibold text-xs sm:text-sm">
                              💳 Payment Pending
                            </p>
                            <button
                              onClick={() => markPaymentSuccess(order._id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm"
                            >
                              Mark as Paid
                            </button>
                          </div>
                        )}

                        {/* ✅ Admin Delete Order */}
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-2">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateStatus(order._id, e.target.value)
                          }
                          className="border rounded p-1.5 sm:p-2 text-xs sm:text-sm w-full"
                        >
                          <option>Pending</option>
                          <option>Cooking</option>
                          <option>Ready</option>
                          <option>Served</option>
                          <option>Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* 🍽️ Food List Tab */}
        {/* 📜 Order History Tab */}
        {activeTab === "history" && <AdminOrderHistory />}

        {activeTab === "foods" && (
          <motion.div
            key="foods"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            {applyGlobalFilter(foods).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No foods available yet.</p>
                <p className="text-gray-400 text-sm mt-2">Add your first food item to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {applyGlobalFilter(foods).map((food) => (
                  <motion.div
                    key={food._id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100"
                  >
                    {/* Image Section - Swiggy Style */}
                    <div className="relative h-40 sm:h-44 overflow-hidden bg-gray-50">
                      <img
                        src={
                          food.image && food.image.startsWith("http")
                            ? food.image
                            : food.image
                            ? `${API_BASE}${food.image}`
                            : "https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image"
                        }
                        alt={food.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        onError={(e) => {
                          e.target.src = "https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image";
                        }}
                      />
                      
                      {/* Type Badge - Top Right (Swiggy Style) */}
                      <div className="absolute top-2 right-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                            food.type === "Veg"
                              ? "bg-green-600"
                              : food.type === "Non-Veg"
                              ? "bg-red-600"
                              : "bg-gray-500"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              food.type === "Veg"
                                ? "bg-white"
                                : food.type === "Non-Veg"
                                ? "bg-white"
                                : "bg-white"
                            }`}
                          ></div>
                        </div>
                      </div>

                      {/* Availability Overlay */}
                      {!food.available && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section - Swiggy Style */}
                    <div className="p-3 sm:p-4">
                      {/* Food Name - Prominent */}
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1.5 line-clamp-2 min-h-[2.5rem]">
                        {food.name}
                      </h3>

                      {/* Category Tag */}
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 font-medium">
                          {food.category}
                        </span>
                      </div>

                      {/* Price and Actions Row - Swiggy Style */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Price</p>
                          <p className="font-bold text-lg sm:text-xl text-gray-900">
                            ₹{Number(food.price).toFixed(0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => editFood(food)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm hover:shadow-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteFood(food._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm hover:shadow-md"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Availability Toggle - Bottom */}
                      <button
                        onClick={() => toggleAvailability(food._id, !food.available)}
                        className={`w-full mt-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                          food.available
                            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                        }`}
                      >
                        {food.available ? "✓ Available" : "✗ Out of Stock"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ➕ Add Food Tab */}
        {activeTab === "addFood" && (
          <motion.div
            key="addFood"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 md:p-8"
          >
            <h3 className="font-bold text-xl sm:text-2xl mb-6 text-gray-800 text-center">
              {editMode ? "✏️ Edit Food Item" : "➕ Add New Food Item"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-5">
                {/* Food Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Food Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={foodForm.name}
                    onChange={handleChange}
                    placeholder="e.g., Margherita Pizza"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="category"
                    value={foodForm.category}
                    onChange={handleChange}
                    placeholder="e.g., Pizza, Burger, Pasta"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={foodForm.type}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select Type</option>
                    <option value="Veg">🟢 Veg</option>
                    <option value="Non-Veg">🔴 Non-Veg</option>
                    <option value="Other">⚪ Other</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                      ₹
                    </span>
                    <input
                      name="price"
                      type="number"
                      value={foodForm.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Image Upload */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Food Image <span className="text-red-500">*</span>
                  </label>

                  {/* Drag and Drop Area */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        await handleImageFile(file);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      isDragging
                        ? "border-orange-500 bg-orange-50 scale-105"
                        : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"
                    } ${compressing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {preview ? (
                      <div className="space-y-3">
                        <div className="relative inline-block">
                          <img
                            src={preview}
                            alt="preview"
                            className="w-full max-w-xs h-48 rounded-lg border-2 border-gray-200 object-cover shadow-md mx-auto"
                          />
                          {compressionInfo && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {compressionInfo.compressed} MB
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setPreview(null);
                              setFoodForm({ ...foodForm, image: null });
                              setCompressionInfo(null);
                            }}
                            className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-all"
                          >
                            ×
                          </button>
                        </div>
                        {compressionInfo && !compressing && (
                          <div className="text-xs bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-green-700 font-semibold mb-1">
                              ✅ Compression Complete
                            </p>
                            <p className="text-green-600">
                              {compressionInfo.original} MB → {compressionInfo.compressed} MB
                            </p>
                            <p className="text-green-600 font-bold">
                              Reduced by {compressionInfo.reduction}%
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          Drag & drop another image or click to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-orange-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-700 font-semibold mb-1">
                            Drag & drop your image here
                          </p>
                          <p className="text-sm text-gray-500">or</p>
                        </div>
                      </div>
                    )}

                    {compressing && (
                      <div className="flex flex-col items-center gap-2 mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        <span className="text-sm text-orange-600 font-medium">
                          Compressing image...
                        </span>
                      </div>
                    )}

                    {/* Manual Upload Button */}
                    <label className="mt-4 inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={compressing}
                        className="hidden"
                      />
                      <span
                        className={`inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg cursor-pointer transition-all shadow-md hover:shadow-lg ${
                          compressing ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        {preview ? "Change Image" : "Browse Files"}
                      </span>
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported: JPG, PNG, WEBP (Max: 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
              {editMode && (
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={saveFood}
                disabled={compressing}
                className={`px-6 py-3 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg ${
                  editMode
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } ${compressing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {compressing ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : editMode ? (
                  "✏️ Update Food"
                ) : (
                  "➕ Add Food"
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* 💰 Total Sales */}
        {activeTab === "sales" && <TotalSales />}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
