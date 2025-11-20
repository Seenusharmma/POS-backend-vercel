import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaChevronLeft, FaShoppingCart, FaLeaf, FaDrumstickBite } from "react-icons/fa";

const MenuSlider = ({ categories = [], selectedCategory = null, onCategoryClick, foods = [], onAddToCart }) => {
  const menuRef = useRef(null);
  const autoScrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const manualScrollTimeoutRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const isAutoScrollingRef = useRef(false);
  const loadingTimeoutRef = useRef(null);

  // Get foods for selected category
  const selectedCategoryFoods = selectedCategory
    ? foods.filter(f => f.category === selectedCategory && f.available !== false)
    : [];

  // Handle loading state when category changes
  useEffect(() => {
    if (selectedCategory) {
      setIsLoadingItems(true);
      
      // Simulate loading delay for smooth UX (can be adjusted based on actual data processing time)
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoadingItems(false);
      }, 300); // 300ms delay for smooth transition

      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      };
    } else {
      setIsLoadingItems(false);
    }
  }, [selectedCategory]);

  // Get category image - use first food's image from that category
  const getCategoryImage = (categoryName) => {
    const categoryFood = foods.find(f => f.category === categoryName && f.image);
    return categoryFood?.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop";
  };

  // Get category icon based on name
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('drink') || name.includes('beverage') || name.includes('juice')) return '🥤';
    if (name.includes('dessert') || name.includes('ice') || name.includes('sweet')) return '🍰';
    if (name.includes('soup')) return '🍲';
    if (name.includes('salad')) return '🥗';
    if (name.includes('pizza') || name.includes('burger')) return '🍕';
    if (name.includes('rice') || name.includes('biryani')) return '🍚';
    if (name.includes('chicken') || name.includes('non')) return '🍗';
    if (name.includes('chaat') || name.includes('snack')) return '🍟';
    if (name.includes('starter') || name.includes('stater')) return '🍤';
    if (name.includes('main')) return '🍛';
    return '🍽️';
  };

  // ADVANCED INTUITIVE SCROLLING - Auto-scroll with manual scroll support
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    // Reset scroll position when content changes
    el.scrollTop = 0;
    lastScrollTopRef.current = 0;
    isUserScrollingRef.current = false;

    // Handle manual scroll detection
    const handleScroll = () => {
      if (!el) return;
      
      // If auto-scrolling, update lastScrollTop but don't mark as user scroll
      if (isAutoScrollingRef.current) {
        lastScrollTopRef.current = el.scrollTop;
        return;
      }
      
      const currentScrollTop = el.scrollTop;
      const scrollDifference = Math.abs(currentScrollTop - lastScrollTopRef.current);
      
      // If scroll difference is significant, user is manually scrolling
      if (scrollDifference > 1) {
        isUserScrollingRef.current = true;
        
        // Clear existing timeout
        if (manualScrollTimeoutRef.current) {
          clearTimeout(manualScrollTimeoutRef.current);
        }
        
        // Resume auto-scroll after user stops scrolling for 2.5 seconds
        manualScrollTimeoutRef.current = setTimeout(() => {
          isUserScrollingRef.current = false;
          lastScrollTopRef.current = currentScrollTop;
        }, 2500);
      }
      
      lastScrollTopRef.current = currentScrollTop;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    // Small delay to allow DOM to update
    const timeoutId = setTimeout(() => {
      if (!el || isPaused) return;

      // Check if content overflows
      const checkOverflow = () => {
        if (!el) return false;
        return el.scrollHeight > el.clientHeight;
      };

      if (!checkOverflow()) return; // No overflow, no need to scroll

      let scrollDirection = 1; // 1 for down, -1 for up
      let scrollSpeed = 0.5; // pixels per frame for smooth scrolling
      let animationFrameId = null;
      let pauseTimeout = null;

      const smoothScroll = () => {
        if (!el || isPaused || isUserScrollingRef.current) {
          // If user is scrolling or paused, wait and check again
          if (isUserScrollingRef.current) {
            animationFrameId = requestAnimationFrame(() => {
              setTimeout(smoothScroll, 100); // Check again after 100ms
            });
          }
          return;
        }

        const { scrollTop, scrollHeight, clientHeight } = el;
        const maxScroll = scrollHeight - clientHeight;

        if (maxScroll <= 0) {
          animationFrameId = null;
          return; // No scrollable content
        }

        if (scrollDirection === 1) {
          // Scrolling down
          if (scrollTop < maxScroll - 1) {
            isAutoScrollingRef.current = true;
            el.scrollTop = Math.min(scrollTop + scrollSpeed, maxScroll);
            lastScrollTopRef.current = el.scrollTop;
            animationFrameId = requestAnimationFrame(smoothScroll);
            // Reset flag after a small delay
            setTimeout(() => {
              isAutoScrollingRef.current = false;
            }, 50);
          } else {
            // Reached bottom, pause then scroll up
            isAutoScrollingRef.current = false;
            pauseTimeout = setTimeout(() => {
              scrollDirection = -1;
              animationFrameId = requestAnimationFrame(smoothScroll);
            }, 1500);
          }
        } else {
          // Scrolling up
          if (scrollTop > 1) {
            isAutoScrollingRef.current = true;
            el.scrollTop = Math.max(scrollTop - scrollSpeed, 0);
            lastScrollTopRef.current = el.scrollTop;
            animationFrameId = requestAnimationFrame(smoothScroll);
            // Reset flag after a small delay
            setTimeout(() => {
              isAutoScrollingRef.current = false;
            }, 50);
          } else {
            // Reached top, pause then scroll down
            isAutoScrollingRef.current = false;
            pauseTimeout = setTimeout(() => {
              scrollDirection = 1;
              animationFrameId = requestAnimationFrame(smoothScroll);
            }, 1500);
          }
        }
      };

      // Start smooth scrolling
      animationFrameId = requestAnimationFrame(smoothScroll);

      // Store cleanup function
      autoScrollRef.current = () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        if (pauseTimeout) {
          clearTimeout(pauseTimeout);
          pauseTimeout = null;
        }
      };
    }, 300);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
      if (autoScrollRef.current) {
        autoScrollRef.current();
        autoScrollRef.current = null;
      }
    };
  }, [categories?.length, selectedCategoryFoods?.length, isPaused, selectedCategory]);

  // Cleanup loading timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Handle back to categories
  const handleBack = () => {
    onCategoryClick && onCategoryClick(selectedCategory);
  };

  return (
    <div className="flex-1 md:flex h-full">
      <motion.div 
        className="bg-white/98 backdrop-blur-md border border-gray-200/80 rounded-lg sm:rounded-xl md:rounded-2xl 
                    p-1.5 sm:p-2.5 md:p-4 w-full min-w-0 flex flex-col h-full shadow-md sm:shadow-lg hover:shadow-xl 
                    transition-all duration-300 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ 
          height: "100%",
          maxHeight: "100%"
        }}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-transparent to-amber-50/20 pointer-events-none"></div>
        
        {/* HEADER - with back button when category selected */}
        {selectedCategory && (
          <motion.div 
            className="mb-1.5 sm:mb-2 md:mb-3 shrink-0 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <motion.button
                onClick={handleBack}
                className="p-1.5 sm:p-1.5 md:p-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] md:min-w-0 md:min-h-0 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 
                         transition-colors duration-200 flex items-center justify-center
                         hover:scale-110 active:scale-95 touch-manipulation"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaChevronLeft className="text-xs sm:text-xs md:text-sm" />
              </motion.button>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 flex items-center gap-1 sm:gap-1.5 md:gap-2 truncate">
                  <span className="text-sm sm:text-base md:text-lg shrink-0">{getCategoryIcon(selectedCategory)}</span>
                  <span className="capitalize truncate">{selectedCategory}</span>
                </h3>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5">
                  {selectedCategoryFoods.length} {selectedCategoryFoods.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CONTENT AREA - Auto-scroll with manual scroll support */}
        <div
          ref={menuRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => {
            setTimeout(() => setIsPaused(false), 2000);
          }}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden 
                     [&::-webkit-scrollbar]:w-1.5 sm:[&::-webkit-scrollbar]:w-2
                     [&::-webkit-scrollbar-track]:bg-gray-100/50
                     [&::-webkit-scrollbar-track]:rounded-full
                     [&::-webkit-scrollbar-thumb]:bg-orange-300/60 sm:[&::-webkit-scrollbar-thumb]:bg-orange-300/50
                     [&::-webkit-scrollbar-thumb]:rounded-full
                     [&::-webkit-scrollbar-thumb]:hover:bg-orange-400/70
                     [&::-webkit-scrollbar-thumb]:active:bg-orange-500/80
                     scroll-smooth relative touch-pan-y"
        >
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {selectedCategory && isLoadingItems ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white/80 backdrop-blur-sm rounded-xl"
              >
                {/* Advanced Animated Loader */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                  {/* Outer Rotating Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-500"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Middle Rotating Ring */}
                  <motion.div
                    className="absolute inset-2 rounded-full border-4 border-transparent border-b-amber-400 border-l-amber-400"
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Inner Pulsing Circle */}
                  <motion.div
                    className="absolute inset-4 rounded-full bg-gradient-to-br from-orange-400 to-amber-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Center Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="text-2xl sm:text-3xl"
                      animate={{
                        rotate: [0, 10, -10, 10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {getCategoryIcon(selectedCategory)}
                    </motion.div>
                  </div>
                </div>
                
                {/* Loading Text */}
                <motion.div
                  className="mt-6 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.p
                    className="text-sm sm:text-base font-semibold text-gray-700 capitalize"
                    animate={{
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Loading {selectedCategory}...
                  </motion.p>
                  
                  {/* Animated Dots */}
                  <div className="flex justify-center gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-orange-500"
                        animate={{
                          y: [0, -8, 0],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : selectedCategory ? (
              // SHOW FOOD ITEMS FOR SELECTED CATEGORY
              <motion.div
                key="foods"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 gap-1.5 md:gap-2.5 lg:gap-3"
              >
                {selectedCategoryFoods.length > 0 ? (
                  selectedCategoryFoods.map((food, index) => (
                    <motion.div
                      key={food._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.25 }}
                      className="group bg-white rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden 
                               border border-gray-100 md:border-gray-200/60 
                               hover:border-orange-300/80 
                               shadow-sm hover:shadow-md transition-all duration-200
                               active:scale-[0.98]"
                    >
                      <div className="flex gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4">
                        {/* Food Image - Compact on Mobile */}
                        <div className="relative flex-shrink-0 w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 
                                      rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden
                                      bg-gray-50 md:bg-gradient-to-br md:from-gray-50 md:to-gray-100 
                                      group-hover:ring-1 md:group-hover:ring-2 group-hover:ring-orange-200/50 
                                      transition-all duration-200">
                          <img
                            src={food.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"}
                            alt={food.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop";
                            }}
                          />
                          {/* Type Badge - Minimal & Compact */}
                          <div className={`absolute top-1 left-1 md:top-2 md:left-2 px-1.5 md:px-2 py-0.5 md:py-1 
                                         rounded-md md:rounded-lg text-[9px] md:text-[10px] lg:text-xs font-semibold
                                         flex items-center gap-0.5 md:gap-1 shadow-md md:shadow-lg backdrop-blur-sm
                                         ${food.type === "Veg" 
                                           ? "bg-green-500/95 text-white" 
                                           : "bg-red-500/95 text-white"
                                         }`}>
                            {food.type === "Veg" ? (
                              <FaLeaf className="text-[8px] md:text-[9px] lg:text-[10px]" />
                            ) : (
                              <FaDrumstickBite className="text-[8px] md:text-[9px] lg:text-[10px]" />
                            )}
                            <span className="hidden md:inline">{food.type}</span>
                          </div>
                        </div>

                        {/* Food Details - Compact Layout */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0 md:py-0.5">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-xs md:text-sm lg:text-base xl:text-lg text-gray-900 mb-0.5 md:mb-1 
                                         group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight md:leading-snug">
                              {food.name}
                            </h4>
                            <p className="text-[10px] md:text-xs lg:text-sm text-gray-400 capitalize mb-1.5 md:mb-2 lg:mb-3 truncate">
                              {food.category}
                            </p>
                          </div>

                          {/* Price and Add Button - Compact */}
                          <div className="flex items-center justify-between gap-2 md:gap-3 mt-auto">
                            <div className="flex flex-col">
                              <span className="text-sm md:text-base lg:text-lg xl:text-xl font-bold text-orange-600 leading-none">
                                ₹{food.price}
                              </span>
                            </div>
                            <motion.button
                              onClick={() => onAddToCart && onAddToCart(food)}
                              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
                                       active:from-orange-700 active:to-orange-800 text-white 
                                       w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full 
                                       flex items-center justify-center
                                       shadow-md hover:shadow-lg transition-all duration-200
                                       active:scale-95 touch-manipulation flex-shrink-0"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaShoppingCart className="text-xs md:text-sm lg:text-base" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="text-5xl mb-4">🍽️</div>
                    <p className="text-gray-400 text-sm sm:text-base">
                      No items available in this category
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              // SHOW CATEGORIES
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-1.5 sm:space-y-2 md:space-y-2.5"
              >
                {categories && categories.length > 0 ? (
                  categories.map((cat, index) => {
                    const isSelected = selectedCategory === cat.name;
                    const categoryImage = cat.image || getCategoryImage(cat.name);
                    const categoryIcon = getCategoryIcon(cat.name);
                    
                    return (
                      <motion.button
                        key={cat.name}
                        onClick={() => onCategoryClick && onCategoryClick(cat.name)}
                        className={`w-full relative overflow-hidden rounded-md sm:rounded-lg md:rounded-xl min-h-[48px] sm:min-h-[52px] md:min-h-0
                                 transition-all duration-300 group touch-manipulation
                                 ${isSelected
                          ? "ring-1.5 sm:ring-2 ring-orange-400 ring-offset-0.5 sm:ring-offset-1 shadow-md sm:shadow-lg scale-[1.005] sm:scale-[1.01]"
                          : "hover:shadow-md hover:scale-[1.005] active:scale-[0.98]"
                        }`}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ 
                          delay: index * 0.05, 
                          duration: 0.3,
                          type: "spring",
                          stiffness: 100
                        }}
                        whileHover={{ scale: isSelected ? 1.02 : 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {/* Background Image with Overlay */}
                        <div className="relative h-12 sm:h-14 md:h-16 lg:h-20 w-full overflow-hidden rounded-md sm:rounded-lg md:rounded-xl">
                          {/* Image */}
                          <img
                            src={categoryImage}
                            alt={cat.name}
                            className={`w-full h-full object-cover transition-transform duration-500
                                      ${isSelected ? "scale-110" : "group-hover:scale-105"}`}
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop";
                            }}
                          />
                          
                          {/* Gradient Overlay */}
                          <div className={`absolute inset-0 transition-all duration-300
                                         ${isSelected 
                                           ? "bg-gradient-to-br from-orange-600/80 via-orange-500/70 to-amber-600/80"
                                           : "bg-gradient-to-br from-black/50 via-black/40 to-black/60 group-hover:from-black/60 group-hover:via-black/50 group-hover:to-black/70"
                                         }`}></div>
                          
                          {/* Content */}
                          <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 md:py-2.5 z-10">
                            {/* Left: Icon and Name */}
                            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 flex-1 min-w-0">
                              {/* Icon */}
                              <div className={`text-base sm:text-lg md:text-xl lg:text-2xl transition-transform duration-300 shrink-0
                                             ${isSelected ? "scale-110" : "group-hover:scale-110"}`}>
                                {categoryIcon}
                              </div>
                              
                              {/* Name and Count */}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className={`capitalize text-xs sm:text-sm md:text-base font-bold truncate leading-tight
                                                ${isSelected ? "text-white" : "text-white"}`}>
                                  {cat.name}
                                </span>
                                <span className={`text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-medium mt-0.5
                                                ${isSelected ? "text-white/90" : "text-white/80"}`}>
                                  {cat.count} {cat.count === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Right: Arrow Icon */}
                            <motion.div
                              className={`shrink-0 transition-all duration-300 ml-0.5 sm:ml-1
                                        ${isSelected ? "text-white" : "text-white/70 group-hover:text-white"}`}
                              animate={{ x: isSelected ? 3 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <FaChevronRight className="text-[10px] sm:text-xs md:text-sm" />
                            </motion.div>
                          </div>
                          
                          {/* Selected Indicator Bar */}
                          {isSelected && (
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-white"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                          
                          {/* Shine Effect on Hover */}
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full 
                                        transition-transform duration-1000 bg-gradient-to-r 
                                        from-transparent via-white/20 to-transparent"></div>
                        </div>
                      </motion.button>
                    );
                  })
                ) : (
                  <motion.div 
                    className="flex flex-col items-center justify-center py-12 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-5xl mb-4">🍽️</div>
                    <p className="text-gray-400 text-sm sm:text-base">
                      No categories available
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default MenuSlider;
