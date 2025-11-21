import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { IoSearch } from "react-icons/io5";
import { FaLeaf, FaDrumstickBite, FaStar, FaShoppingCart } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../config/api";
import { getSocketConfig, isServerlessPlatform } from "../utils/socketConfig";
import LogoLoader from "./LogoLoader";
import FoodCard from "./FoodCard";
import { useFoodFilter } from "../store/hooks";
import { useAppSelector } from "../store/hooks";

const Menu = () => {
  const { filterFoods: applyGlobalFilter } = useFoodFilter();
  const { user } = useAppSelector((state) => state.auth);
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
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

  // 🔎 Live Search Suggestions
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      const matched = foods
        .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSuggestions(matched);
    } else setSuggestions([]);
  };

  const handleSuggestionClick = (name) => {
    setSearchQuery(name);
    setSuggestions([]);
  };

  // 🛒 Cart Logic (localStorage)
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cart));
  }, [cart]);

  // Real-time socket notifications
  useEffect(() => {
    if (!user) return;

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
      console.log("✅ Menu Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.connect();
      }
      console.log("❌ Menu Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      // Suppress expected errors
      const errorMessage = error.message || "";
      if (!errorMessage.includes("websocket") && !errorMessage.includes("closed")) {
        console.error("❌ Menu Socket connection error:", error);
      }
    });

    // 🔊 Listen for food updates - Real-time notification with sound
    socket.on("foodUpdated", (updatedFood) => {
      console.log("🍽️ Food updated:", updatedFood);
      
      // Play notification sound
      playNotificationSound();
      
      // Update foods list
      setFoods((prev) =>
        prev.map((f) => (f._id === updatedFood._id ? updatedFood : f))
      );
      
      // Show notification based on what changed
      if (updatedFood.available !== undefined) {
        if (updatedFood.available) {
          toast.success(`✅ ${updatedFood.name} is now Available!`, {
            duration: 4000,
            position: "top-center",
            icon: "🍽️",
          });
        } else {
          toast.error(`❌ ${updatedFood.name} is now Out of Stock`, {
            duration: 4000,
            position: "top-center",
            icon: "⚠️",
          });
        }
      } else {
        // Other updates (price, name, etc.)
        toast.success(`🔄 ${updatedFood.name} has been updated`, {
          duration: 3000,
          position: "top-center",
          icon: "📝",
        });
      }
    });

    // 🔊 Listen for new food added - Real-time notification with sound
    socket.on("newFoodAdded", (newFood) => {
      console.log("➕ New food added:", newFood);
      
      // Play notification sound
      playNotificationSound();
      
      // Add to foods list
      setFoods((prev) => [newFood, ...prev]);
      
      toast.success(`🆕 New item added: ${newFood.name}`, {
        duration: 4000,
        position: "top-center",
        icon: "🍕",
      });
    });

    // 🔊 Listen for food deleted - Real-time notification with sound
    socket.on("foodDeleted", (foodId) => {
      console.log("🗑️ Food deleted:", foodId);
      
      // Play notification sound
      playNotificationSound();
      
      // Remove from foods list
      setFoods((prev) => prev.filter((f) => f._id !== foodId));
      
      toast.error(`🗑️ A food item has been removed from the menu`, {
        duration: 3000,
        position: "top-center",
        icon: "⚠️",
      });
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
      // Clean up all event listeners
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("foodUpdated");
      socket.off("newFoodAdded");
      socket.off("foodDeleted");
      socket.off("newOrderPlaced");
      socket.off("orderStatusChanged");
      socket.off("paymentSuccess");
      // Don't disconnect on cleanup - let it stay connected for other components
    };
  }, [user]);

  const addToCart = (food) => {
    const existing = cart.find((item) => item._id === food._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === food._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
  };

  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff8f3] to-white pb-24 md:pb-12 ">
      <Toaster />
      {/* 🍔 Hero Section */}
      <section className="relative bg-gradient-to-r from-[#ffecd2] to-[#fcb69f] py-12 sm:py-16 md:py-20 shadow-md text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800"
        >
          Delicious Food, Delivered Fast 🚀
        </motion.h1>
        <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg px-4">
          Discover top-rated dishes near you from Food Fantasy 🍱
        </p>

        {/* 🔍 Search Bar */}
        <div className="relative w-full sm:w-5/6 md:w-2/3 lg:w-1/2 mx-auto mt-4 sm:mt-6">
          <div className="flex items-center bg-white shadow-xl rounded-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200">
            <IoSearch className="text-gray-500 text-lg sm:text-xl mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search for food, dishes or cuisines..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 p-1 sm:p-2 outline-none text-gray-700 text-sm sm:text-base bg-transparent"
            />
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute w-full bg-white border border-gray-200 rounded-lg mt-2 shadow-xl z-20 max-h-60 overflow-y-auto">
              {suggestions.map((s) => (
                <li
                  key={s._id}
                  onClick={() => handleSuggestionClick(s.name)}
                  className="px-3 sm:px-4 py-2 hover:bg-red-50 cursor-pointer text-gray-700 text-sm sm:text-base"
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 🎛 Filters */}
      <div className="flex flex-col gap-4 sm:gap-5 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-10 bg-white shadow-sm sticky top-0 z-10">
        {/* Category Filter */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-hide" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
          {categories.map((cat) => (
            <motion.button
              whileTap={{ scale: 0.9 }}
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-semibold border text-xs sm:text-sm md:text-base transition-all whitespace-nowrap shrink-0 ${
                categoryFilter === cat
                  ? "bg-yellow-500 text-white border-yellow-500 shadow"
                  : "border-gray-300 text-gray-700 hover:bg-yellow-50"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 🍕 Food Cards Grid */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-10 py-6 sm:py-8 md:py-10">
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
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
          >
            {filteredFoods.map((food) => (
              <motion.div
                key={food._id}
                whileHover={{ scale: 1.02 }}
                className="bg-white border rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl overflow-hidden flex flex-col"
              >
                <div className="relative">
                  <img
                    src={food.image || "https://via.placeholder.com/400x300"}
                    alt={food.name}
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                  <span
                    className={`absolute top-2 sm:top-3 left-2 sm:left-3 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${
                      food.type === "Veg"
                        ? "bg-green-100 text-green-700 border border-green-500"
                        : "bg-red-100 text-red-700 border border-red-500"
                    }`}
                  >
                    {food.type}
                  </span>
                </div>

                <div className="p-3 sm:p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-1">{food.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 capitalize mb-2">
                    {food.category}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-yellow-500 mb-2">
                    <FaStar className="text-sm sm:text-base" />
                    <span className="text-gray-700 text-xs sm:text-sm">
                      {food.rating || "4.3"} • {Math.floor(Math.random() * 30 + 10)} min
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-auto pt-2">
                    <span className="text-base sm:text-lg font-bold text-red-600">
                      ₹{food.price}
                    </span>
                    <button
                      onClick={() => addToCart(food)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1"
                    >
                      <FaShoppingCart className="text-xs sm:text-sm" /> Add
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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
    </div>
  );
};

export default Menu;
