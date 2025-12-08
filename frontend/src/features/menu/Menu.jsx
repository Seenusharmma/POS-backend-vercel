import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { FaLeaf, FaDrumstickBite, FaStar, FaShoppingCart, FaArrowUp, FaMinus, FaPlus } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import API_BASE from "../../config/api";
import MenuSkeleton from "../../components/ui/MenuSkeleton";
import { useFoodFilter, useAppSelector, useAppDispatch } from "../../store/hooks";
import { addToCartAsync, updateQuantityAsync, removeFromCartAsync } from "../../store/slices/cartSlice";
import { getSocketConfig, createSocketConnection, isServerlessPlatform } from "../../utils/socketConfig";
import SizeSelectionModal from "../../components/common/SizeSelectionModal";
import EnhancedSearchBar from "../../components/search/EnhancedSearchBar";
import { useDebounce } from "../../hooks/useDebounce";

const Menu = () => {
  const { filterFoods: applyGlobalFilter } = useFoodFilter();
  const { user } = useAppSelector((state) => state.auth);
  const cart = useAppSelector((state) => state.cart.items);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const socketRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [spellSuggestion, setSpellSuggestion] = useState(null);
  
  // Debounce search query for faster response (150ms delay)
  const debouncedQuery = useDebounce(searchQuery, 150);
  
  // Track if initial fetch is done
  const hasFetchedRef = useRef(false);

  // 🥗 Fetch foods with intelligent caching
  useEffect(() => {
    const fetchFoods = async (useCache = true) => {
      try {
        // Check if we have cached data and should use it
        const cachedData = localStorage.getItem('menuFoodsCache');
        const cacheTimestamp = localStorage.getItem('menuFoodsCacheTime');
        const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (reduced from 5 for fresher data)
        
        // Show cached data immediately for instant display, but always fetch fresh
        if (cachedData && cacheTimestamp && useCache) {
          const cacheAge = Date.now() - parseInt(cacheTimestamp);
          if (cacheAge < CACHE_DURATION) {
            const cached = JSON.parse(cachedData);
            setFoods(cached);
            setFilteredFoods(cached);
            setLoading(false);
            console.log('📦 Using cached menu data');
          }
        }
        
        // Always fetch fresh data from API (either in background or foreground)
        console.log('🔄 Fetching fresh menu data from server...');
        const res = await axios.get(`${API_BASE}/api/foods`);
        
        // Update state with fresh data
        setFoods(res.data);
        setFilteredFoods(res.data);
        
        // Update cache with fresh data
        localStorage.setItem('menuFoodsCache', JSON.stringify(res.data));
        localStorage.setItem('menuFoodsCacheTime', Date.now().toString());
        
        console.log(`✅ Menu data updated (${res.data.length} items)`);
        setLoading(false);
        hasFetchedRef.current = true;
      } catch (err) {
        console.error("Error fetching menu:", err);
        setLoading(false);
      }
    };
    
    // On mount: show cache immediately, then fetch fresh data
    fetchFoods(true);
    
    // Cleanup function
    return () => {
      // Reset fetch flag when component unmounts
      hasFetchedRef.current = false;
    };
  }, []); // Empty dependency array - runs on mount/unmount only

  // 🏷️ Dynamic categories
  const categories = ["All", ...new Set(foods.map((f) => f.category))];

  // 🔍 Initialize Fuse.js for fuzzy search - Optimized for speed
  const fuse = useMemo(() => {
    if (!foods || foods.length === 0) return null;
    
    return new Fuse(foods, {
      keys: [
        { name: "name", weight: 0.7 }, // Name is most important
        { name: "category", weight: 0.2 }, // Category is secondary
        { name: "type", weight: 0.1 }, // Type is least important
      ],
      threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything (lower = stricter)
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true, // Search anywhere in the string
      findAllMatches: false, // Set to false for better performance
      useExtendedSearch: false, // Disable extended search for speed
      shouldSort: true, // Sort results by relevance
    });
  }, [foods]);
  
  // Update debounced search query and set searching state
  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery !== debouncedSearchQuery) {
      setIsSearching(true);
      // Simulate search processing delay for better UX
      const timer = setTimeout(() => {
        setDebouncedSearchQuery(debouncedQuery);
        // Keep searching state for a bit longer to show skeleton
        setTimeout(() => setIsSearching(false), 100);
      }, 150);
      return () => clearTimeout(timer);
    } else if (!debouncedQuery.trim()) {
      setDebouncedSearchQuery("");
      setIsSearching(false);
    }
  }, [debouncedQuery, debouncedSearchQuery]);
  
  // Set searching state when search query changes (before debounce)
  useEffect(() => {
    if (searchQuery.trim() && searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    } else if (!searchQuery.trim()) {
      setIsSearching(false);
    }
  }, [searchQuery, debouncedSearchQuery]);

  // 🧠 Filter Logic with Fuse.js (includes global filter) - Optimized with debouncing
  useEffect(() => {
    // Clear searching state when filtering is complete
    if (debouncedSearchQuery.trim() && fuse) {
      setIsSearching(false);
    }
    
    let updated = [];
    
    // Use debounced query for actual search to reduce computation
    const queryToSearch = debouncedSearchQuery.trim();
    
    // If there's a search query, search first, then apply filters
    if (queryToSearch && fuse) {
      // Fast search with limit for better performance
      const searchResults = fuse.search(queryToSearch, { limit: 100 });
      
      // 🔍 Spell correction detection (only for longer queries to avoid unnecessary computation)
      if (queryToSearch.length >= 3) {
        if (searchResults.length > 0) {
          const bestMatch = searchResults[0];
          const bestScore = bestMatch.score || 1;
          
          // If the best match has a score > 0.3 (meaning it's not a great match)
          // and the query doesn't exactly match any food name, suggest correction
          const exactMatch = foods.some(f => 
            f.name.toLowerCase() === queryToSearch.toLowerCase()
          );
          
          if (bestScore > 0.3 && !exactMatch) {
            // Suggest the best matching food name
            setSpellSuggestion(bestMatch.item.name);
          } else {
            setSpellSuggestion(null);
          }
        } else {
          // No results found, try a more lenient search for suggestions
          const lenientFuse = new Fuse(foods, {
            keys: [{ name: "name", weight: 1 }],
            threshold: 0.6, // More lenient threshold
            includeScore: true,
            minMatchCharLength: 2,
            ignoreLocation: true,
            findAllMatches: false, // Performance optimization
          });
          
          const lenientResults = lenientFuse.search(queryToSearch, { limit: 1 });
          if (lenientResults.length > 0) {
            setSpellSuggestion(lenientResults[0].item.name);
          } else {
            setSpellSuggestion(null);
          }
        }
      } else {
        setSpellSuggestion(null);
      }
      
      // Get search result items
      const searchResultItems = searchResults.map((result) => result.item);
      updated = [...searchResultItems];
    } else {
      // No search query, start with all foods
      updated = [...foods];
      setSpellSuggestion(null);
    }
    
    // Apply global Veg/Non-Veg filter
    updated = applyGlobalFilter(updated);
    
    // Apply category filter
    if (categoryFilter !== "All") {
      updated = updated.filter((f) => f.category === categoryFilter);
    }
    
    setFilteredFoods(updated);
  }, [categoryFilter, debouncedSearchQuery, foods, applyGlobalFilter, fuse]);
  
  // Handle spell correction suggestion click
  const handleSpellCorrection = () => {
    if (spellSuggestion) {
      setSearchQuery(spellSuggestion);
      setSpellSuggestion(null);
    }
  };

  // Show/hide scroll button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      // Show button when scrolled down more than 300px
      setShowScrollButton(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    // Check initial scroll position
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


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

    // Listen for food updates and invalidate cache
    socket.on("foodUpdated", (updatedFood) => {
      // Invalidate cache so next load gets fresh data
      localStorage.removeItem('menuFoodsCache');
      localStorage.removeItem('menuFoodsCacheTime');
      
      // Update local state immediately
      setFoods((prev) => 
        prev.map((f) => f._id === updatedFood._id ? updatedFood : f)
      );
    });

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

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("foodUpdated");
      socket.off("newOrderPlaced");
      socket.off("orderStatusChanged");
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

  // Helper to get quantity of an item in cart
  const getItemQuantity = (foodId) => {
    const item = cart.find(item => item._id === foodId);
    return item ? item.quantity : 0;
  };

  const handleIncrement = async (food) => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    const currentQty = getItemQuantity(food._id);
    try {
      await dispatch(updateQuantityAsync({
        userEmail: user.email,
        foodId: food._id,
        quantity: currentQty + 1
      })).unwrap();
    } catch (error) {
      console.error("Failed to increment:", error);
      toast.error("Failed to update quantity");
    }
  };

  const handleDecrement = async (food) => {
    if (!user) return;
    const currentQty = getItemQuantity(food._id);
    try {
      if (currentQty > 1) {
        await dispatch(updateQuantityAsync({
          userEmail: user.email,
          foodId: food._id,
          quantity: currentQty - 1
        })).unwrap();
      } else {
        await dispatch(removeFromCartAsync({
          userEmail: user.email,
          foodId: food._id
        })).unwrap();
        toast.success("Item removed from cart");
      }
    } catch (error) {
      console.error("Failed to decrement:", error);
      toast.error("Failed to update quantity");
    }
  };

  const addToCart = async (food) => {
    if (!user || !user.email) {
      toast.error("Please login to add items to cart!");
      navigate("/login");
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


  // Don't show full page loader, show skeleton instead

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
            {/* Enhanced Search Bar - Swiggy/Zomato Style */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:flex-1 max-w-2xl order-2 sm:order-1"
            >
              <EnhancedSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                foods={foods}
                onSearch={(query) => {
                  // Save to history is handled inside EnhancedSearchBar
                  setSpellSuggestion(null);
                }}
                placeholder="Search for food, dishes or cuisines..."
              />
              
              {/* Spell Correction Suggestion - Show below search bar */}
              {spellSuggestion && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 text-sm font-medium">
                        Did you mean:
                      </span>
                      <button
                        onClick={handleSpellCorrection}
                        className="text-blue-700 font-semibold text-sm hover:text-blue-800 underline decoration-2 underline-offset-2"
                      >
                        {spellSuggestion}
                      </button>
                    </div>
                    <button
                      onClick={() => setSpellSuggestion(null)}
                      className="text-blue-400 hover:text-blue-600 text-xs"
                      aria-label="Dismiss suggestion"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
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
                <AnimatePresence>
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
        {loading ? (
          <MenuSkeleton count={10} />
        ) : isSearching ? (
          <MenuSkeleton count={8} />
        ) : filteredFoods.length === 0 ? (
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
            <AnimatePresence>
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
                    {/* Show Quantity Controls if item is in cart and has no sizes */
                    !food.hasSizes && getItemQuantity(food._id) > 0 ? (
                      <div className="flex items-center bg-orange-100 rounded-full overflow-hidden shadow-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecrement(food);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-200 transition-colors"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-orange-700">
                          {getItemQuantity(food._id)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncrement(food);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-200 transition-colors"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddClick(food);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1 shadow-sm hover:shadow-md transition-all"
                      >
                        <FaShoppingCart className="text-xs sm:text-sm" /> Add
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Scroll to Top Button - positioned at bottom of food items */}
        {showScrollButton && filteredFoods.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex justify-center mt-8 sm:mt-10"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-lg flex items-center gap-2 font-semibold text-sm sm:text-base transition-all duration-300"
              aria-label="Scroll to top"
            >
              <FaArrowUp className="text-sm sm:text-base" />
              <span>Scroll to Top</span>
            </motion.button>
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
