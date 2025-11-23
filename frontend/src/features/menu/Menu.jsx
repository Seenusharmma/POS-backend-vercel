import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { FaLeaf, FaDrumstickBite, FaStar, FaShoppingCart } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../../config/api";
import LogoLoader from "../../components/ui/LogoLoader";
import { useFoodFilter, useAppSelector, useAppDispatch } from "../../store/hooks";
import { addToCartAsync } from "../../store/slices/cartSlice";
import { getSocketConfig, createSocketConnection, isServerlessPlatform } from "../../utils/socketConfig";
import SizeSelectionModal from "../../components/common/SizeSelectionModal";

const Menu = () => {
  const { filterFoods: applyGlobalFilter } = useFoodFilter();
  const { user } = useAppSelector((state) => state.auth);
  const cart = useAppSelector((state) => state.cart.items);
  const dispatch = useAppDispatch();
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const socketRef = useRef(null);

  // 🥗 Fetch foods
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/foods`);
        setFoods(res.data);
        setFilteredFoods(res.data);
        setTimeout(() => setLoading(false), 800);
      } catch (err) {
        console.error("Error fetching menu:", err);
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // 🏷️ Dynamic categories
  const categories = ["All", ...new Set(foods.map((f) => f.category))];

  // 🧠 Filter Logic (includes global filter)
  useEffect(() => {
    let updated = applyGlobalFilter([...foods]); // Apply global Veg/Non-Veg filter first
    if (categoryFilter !== "All")
      updated = updated.filter((f) => f.category === categoryFilter);
    if (searchQuery.trim())
      updated = updated.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    setFilteredFoods(updated);
  }, [categoryFilter, searchQuery, foods, applyGlobalFilter]);


  // Cart is now managed by Redux and synced with backend

  // ✅ Real-time socket notifications with optimized configuration
  useEffect(() => {
    if (!user) return;

    const isServerless = isServerlessPlatform();
    
    if (!socketRef.current) {
      if (isServerless) {
        // On serverless platforms, create a mock socket
        socketRef.current = {
          on: () => {},
          off: () => {},
          emit: () => {},
          disconnect: () => {},
          connected: false,
          metrics: { quality: "unavailable" },
        };
      } else {
        // ✅ Create optimized socket connection as user
        const socketConfig = getSocketConfig({
          type: "user",
          userId: user?.uid || null,
          autoConnect: true,
        });
        
        socketRef.current = createSocketConnection(API_BASE, socketConfig);
      }
    }
    const socket = socketRef.current;

    // Connection event listeners (silent)
    if (socket.on && socket.connected) {
      socket.on("connect", () => {
        // Silently connected
      });

      socket.on("disconnect", () => {
        // Silently disconnected
      });

      socket.on("connect_error", (error) => {
        // Suppress expected errors - silently handle
      });
    }

    // Listen for new orders (booking) - Real-time notification
    socket.on("newOrderPlaced", (newOrder) => {
      if (newOrder.userEmail === user.email || newOrder.userId === user.uid) {
        toast.success(`📦 Order Placed: ${newOrder.foodName}`, {
          duration: 4000,
          position: "top-center",
        });
      }
    });

    // Listen for status changes - Real-time notification
    socket.on("orderStatusChanged", (updatedOrder) => {
      if (updatedOrder.userEmail === user.email || updatedOrder.userId === user.uid) {
        const statusMessages = {
          Pending: "⏳ Your order is pending",
          Cooking: "👨‍🍳 Your order is being cooked",
          Ready: "✅ Your order is ready",
          Served: "🍽️ Your order has been served",
          Completed: "🎉 Your order is completed",
        };
        toast.success(
          `${statusMessages[updatedOrder.status] || "Order status updated"}: ${updatedOrder.foodName}`,
          {
            duration: 4000,
            position: "top-center",
          }
        );
      }
    });

    // Listen for payment success - Real-time notification
    socket.on("paymentSuccess", (orderData) => {
      if (orderData && (orderData.userEmail === user.email || orderData.userId === user.uid)) {
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
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("newOrderPlaced");
      socket.off("orderStatusChanged");
      socket.off("paymentSuccess");
    };
  }, [user]);

  const handleAddClick = (food) => {
    // Check if food has sizes - if so, open size selection modal
    const sizeType = food.sizeType || "standard";
    const hasStandardSizes = food.hasSizes && food.sizes && (food.sizes.Small || food.sizes.Medium || food.sizes.Large);
    const hasHalfFullSizes = food.hasSizes && food.halfFull && (food.halfFull.Half || food.halfFull.Full);
    const hasValidSizes = sizeType === "half-full" ? hasHalfFullSizes : hasStandardSizes;
    
    if (food.hasSizes && hasValidSizes) {
      setSelectedFood(food);
      setShowSizeModal(true);
    } else if (food.hasSizes) {
      // Food has sizes enabled but no size prices set - show error
      toast.error("Size options are not available for this item. Please contact admin.");
      return;
    } else {
      // Food doesn't have sizes - add directly
      addToCart(food);
    }
  };

  const handleSizeConfirm = (selectedSize, selectedPrice) => {
    if (!selectedFood) return;
    
    const foodWithSize = {
      ...selectedFood,
      selectedSize,
      price: Number(selectedPrice),
      hasSizes: selectedFood.hasSizes || false,
      sizeType: selectedFood.sizeType || "standard", // Preserve sizeType (standard or half-full)
      sizes: selectedFood.sizes || null,
      halfFull: selectedFood.halfFull || null, // Ensure halfFull object is included
    };
    
    addToCart(foodWithSize);
    setShowSizeModal(false);
    setSelectedFood(null);
  };

  const addToCart = async (food) => {
    if (!user || !user.email) {
      toast.error("Please login to add items to cart!");
      return;
    }

    try {
      await dispatch(
        addToCartAsync({
          userData: user,
          food,
          quantity: 1,
        })
      ).unwrap();
      
      toast.success(`${food.name} added to cart! 🛒`, {
        duration: 2000,
        position: "top-center",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to add item to cart. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Calculate price display for foods with sizes
  const getPriceDisplay = (food) => {
    if (food.hasSizes) {
      const sizeType = food.sizeType || "standard";
      let prices = [];
      
      if (sizeType === "half-full" && food.halfFull) {
        prices = [
          food.halfFull.Half,
          food.halfFull.Full,
        ].filter((p) => p !== null && p !== undefined && p > 0);
      } else if (food.sizes) {
        prices = [
          food.sizes.Small,
          food.sizes.Medium,
          food.sizes.Large,
        ].filter((p) => p !== null && p !== undefined && p > 0);
      }
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
          return `₹${minPrice}`;
        }
        return `₹${minPrice} - ₹${maxPrice}`;
      }
    }
    return `₹${food.price || 0}`;
  };


  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff8f3] to-white pb-24 md:pb-12 pt-16">
      <Toaster />

      {/* 🔍 Search Bar & Category Stripe - Theme + Advanced Animations */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-16 z-40 bg-white/98 backdrop-blur-xl border-b border-gray-100/80 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4">
            {/* Search Bar - Advanced Focus Animation */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:flex-1 max-w-xl order-2 sm:order-1"
            >
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative group"
              >
                <motion.div
                  animate={{
                    borderColor: searchQuery ? "#ea580c" : undefined,
                    backgroundColor: searchQuery ? "#fff7ed" : undefined,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center bg-gray-50/90 backdrop-blur-sm border-2 rounded-2xl px-4 py-2.5 transition-all duration-300 focus-within:bg-white focus-within:border-orange-500/60 focus-within:shadow-lg focus-within:shadow-orange-500/10"
                >
                  <motion.div
                    animate={{
                      color: searchQuery ? "#ea580c" : undefined,
                      scale: searchQuery ? 1.1 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <IoSearch className="text-gray-400 text-base mr-2.5 shrink-0" />
                  </motion.div>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none text-gray-900 text-sm bg-transparent placeholder:text-gray-400 font-light tracking-wide"
                  />
                  {searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      onClick={() => setSearchQuery("")}
                      className="cursor-pointer text-gray-400 hover:text-orange-500 ml-2"
                    >
                      ✕
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Category Buttons - Staggered Entrance + Advanced Hover */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:w-auto order-1 sm:order-2 overflow-x-auto scrollbar-hide relative z-10" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex gap-2 sm:gap-2.5 items-center relative">
                <AnimatePresence mode="wait">
                  {categories.map((cat, index) => (
                    <motion.button
                      key={cat}
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0 
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        y: -2,
                        transition: { type: "spring", stiffness: 400, damping: 15 }
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        transition: { duration: 0.1 }
                      }}
                      onClick={() => setCategoryFilter(cat)}
                      className={`relative px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium tracking-tight whitespace-nowrap shrink-0 overflow-visible transition-all duration-300 z-10 hover:z-20 active:z-20 ${
                        categoryFilter === cat
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm z-20"
                          : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                      }`}
                    >
                      {/* Text */}
                      <span className="relative z-10">
                        {cat}
                      </span>
                      
                      {/* Active Indicator Dot */}
                      {categoryFilter === cat && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full mb-0.5 z-10"
                        />
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 🍕 Food Cards Grid */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-7 py-6 sm:py-8 md:py-10">
        {filteredFoods.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-600 mt-8 sm:mt-12 text-sm sm:text-base md:text-lg"
          >
            No foods match your selection 🍴
          </motion.p>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
          >
            <AnimatePresence mode="wait">
              {filteredFoods.map((food, index) => (
                <motion.div
                  key={food._id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.03,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col cursor-pointer"
                >
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl overflow-hidden">
                  <div className="relative">
                    <img
                      src={food.image || "https://via.placeholder.com/400x300"}
                      alt={food.name}
                      className="w-full h-36 sm:h-40 object-cover"
                    />
                    {/* Black gradient overlay from bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
                    
                    {/* Veg/Non-Veg Badge */}
                    <span
                      className={`absolute top-2 sm:top-3 left-2 sm:left-3 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md z-10 ${
                        food.type === "Veg"
                          ? "bg-green-100 text-green-700 border border-green-500"
                          : "bg-red-100 text-red-700 border border-red-500"
                      }`}
                    >
                      {food.type}
                    </span>

                    {/* Sizes Available Badge */}
                    {food.hasSizes && (
                      <span className="absolute top-2 sm:top-3 right-2 sm:right-3 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md z-10 bg-orange-100 text-orange-700 border border-orange-500 font-semibold">
                        Sizes
                      </span>
                    )}

                    {/* Dish Name on Gradient */}
                    <h3 className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-3 sm:pb-4 font-bold text-white text-base sm:text-lg z-10 drop-shadow-lg">
                      {food.name}
                    </h3>
                  </div>
                </div>

                <div className="px-3 sm:px-4 pt-2 pb-3 sm:pb-4 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs sm:text-sm text-gray-500 capitalize">
                      {food.category}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-yellow-500">
                      <FaStar className="text-sm sm:text-base" />
                      <span className="text-gray-700 text-xs sm:text-sm">
                        {food.rating || "4.3"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-auto pt-1">
                    <div>
                      <span className="text-base sm:text-lg font-bold text-orange-600">
                        {getPriceDisplay(food)}
                      </span>
                      {food.hasSizes && (
                        <p className="text-xs text-gray-500 mt-0.5">Select size</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddClick(food)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1"
                    >
                      <FaShoppingCart className="text-xs sm:text-sm" /> Add
                    </button>
                  </div>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* 🛒 Floating Cart Button */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-20 sm:bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold cursor-pointer z-40 text-sm sm:text-base"
          onClick={() => (window.location.href = "/order")}
        >
          <FaShoppingCart />
          View Cart ({cart.length})
        </motion.div>
      )}

      {/* Size Selection Modal */}
      {selectedFood && (
        <SizeSelectionModal
          food={selectedFood}
          isOpen={showSizeModal}
          onClose={() => {
            setShowSizeModal(false);
            setSelectedFood(null);
          }}
          onConfirm={handleSizeConfirm}
        />
      )}
    </div>
  );
};

export default Menu;
