import React, { useState } from "react";
import { FaShoppingCart, FaCheck, FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const CarouselCard = ({ food, type, onAddToCart }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  if (!food) return null;

  const isVeg = type === "Veg";
  const accentColor = isVeg ? "text-emerald-600" : "text-rose-600";
  const accentBg = isVeg ? "bg-emerald-50" : "bg-rose-50";
  const accentBorder = isVeg ? "border-emerald-200" : "border-rose-200";
  const buttonColor = isVeg ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800" : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800";
  const successColor = isVeg ? "bg-emerald-500" : "bg-rose-500";

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (food && onAddToCart) {
      onAddToCart(food);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  return (
    <motion.div 
      className="relative rounded-2xl overflow-hidden h-full shadow-lg hover:shadow-2xl transition-all duration-500 group cursor-pointer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
    >
      {/* Full-screen image container */}
      <div className="absolute inset-0 w-full h-full">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        
        <motion.img
          src={food?.image || "https://via.placeholder.com/400x300"}
          alt={food?.name || "Food item"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
        
        {/* Strong gradient overlay - bottom to top for better text contrast and separation from image */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] sm:h-[40%] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>
      
      {/* Advanced type badge - top left with better design */}
      <motion.div
        className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="bg-white/90 backdrop-blur-lg border border-white/40 px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xl flex items-center gap-1 sm:gap-1.5">
          <div className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm`} />
          <span className={`text-[7px] sm:text-[8px] md:text-[9px] font-bold ${accentColor} uppercase tracking-widest`}>
            {type || "Food"}
          </span>
        </div>
      </motion.div>
      
      {/* Advanced content overlay - positioned at bottom with better hierarchy */}
      <div className="absolute inset-0 flex flex-col justify-end p-2.5 sm:p-4 md:p-5 lg:p-6 z-10">
        {/* Food name - enhanced typography */}
        <motion.h3 
          className="font-bold text-base sm:text-xl md:text-2xl lg:text-3xl text-white mb-1 sm:mb-2 line-clamp-2 leading-tight drop-shadow-2xl tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {food?.name || "Unknown"}
        </motion.h3>
        
        {/* Category - with icon-like styling */}
        <motion.div 
          className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="h-px w-5 sm:w-6 bg-white/60" />
          <span className="text-[10px] sm:text-xs md:text-sm text-white/95 capitalize font-medium tracking-wide">
            {food?.category || "Category"}
          </span>
        </motion.div>
        
        {/* Advanced bottom section - price and CTA with better layout */}
        <motion.div 
          className="flex items-end justify-between gap-2 sm:gap-3 pt-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Enhanced price display */}
          <div className="flex flex-col">
            <span className="text-[7px] sm:text-[8px] md:text-[9px] text-white/70 font-medium mb-0.5 sm:mb-1 uppercase tracking-widest">Price</span>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className="text-xs sm:text-sm md:text-base text-white/90 font-semibold">₹</span>
              <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-2xl leading-none">
                {food?.price || 0}
              </span>
            </div>
          </div>
          
          {/* Advanced add to cart button - more intuitive design */}
          <motion.button
            onClick={handleAddToCart}
            className={`${isAdded ? successColor : buttonColor} text-white px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center gap-1 sm:gap-1.5 md:gap-2 font-semibold sm:font-bold shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden min-w-[75px] sm:min-w-[100px] md:min-w-[115px] justify-center group/btn`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label={`Add ${food?.name} to cart`}
          >
            {/* Ripple effect on click */}
            <motion.div
              className="absolute inset-0 bg-white/30 rounded-lg sm:rounded-xl md:rounded-2xl"
              initial={{ scale: 0, opacity: 0.5 }}
              whileTap={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
            
            {/* Success feedback overlay */}
            {isAdded && (
              <motion.div
                className="absolute inset-0 bg-white/30 rounded-lg sm:rounded-xl md:rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            
            {/* Icon with advanced animation */}
            <AnimatePresence mode="wait">
              {isAdded ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 600, damping: 25 }}
                >
                  <FaCheck className="text-[10px] sm:text-xs md:text-sm" />
                </motion.div>
              ) : (
                <motion.div
                  key="cart"
                  initial={{ scale: 0, y: -5 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: 5 }}
                  transition={{ type: "spring", stiffness: 600, damping: 25 }}
                  className="group-hover/btn:rotate-12 transition-transform duration-300"
                >
                  <FaShoppingCart className="text-[10px] sm:text-xs md:text-sm" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Clear button text with better typography */}
            <span className="text-[10px] sm:text-xs md:text-sm font-semibold sm:font-bold relative z-10 tracking-wide">
              {isAdded ? "Added!" : "Add to Cart"}
            </span>
          </motion.button>
        </motion.div>
      </div>
      
      {/* Success indicator - visual feedback */}
      <AnimatePresence>
        {isAdded && (
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-30 rounded-lg sm:rounded-xl md:rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`${successColor} text-white px-3 sm:px-5 md:px-6 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center gap-1.5 sm:gap-2 md:gap-3 shadow-2xl border-2 border-white/30`}
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <FaCheck className="text-sm sm:text-base md:text-lg" />
              <span className="font-bold text-xs sm:text-sm md:text-base">Added to Cart!</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CarouselCard;

