import React, { useState } from "react";
import { FaShoppingCart, FaCheck, FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import SizeSelectionModal from "../../components/common/SizeSelectionModal";

const CarouselCard = ({ food, type, onAddToCart }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  
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
      // Check if food has sizes - if so, open size selection modal
      const sizeType = food.sizeType || "standard";
      const hasStandardSizes = food.hasSizes && food.sizes && (food.sizes.Small || food.sizes.Medium || food.sizes.Large);
      const hasHalfFullSizes = food.hasSizes && food.halfFull && (food.halfFull.Half || food.halfFull.Full);
      const hasValidSizes = sizeType === "half-full" ? hasHalfFullSizes : hasStandardSizes;
      
      if (food.hasSizes && hasValidSizes) {
        setShowSizeModal(true);
      } else if (food.hasSizes) {
        // Food has sizes enabled but no size prices set - show error
        toast.error("Size options are not available for this item. Please contact admin.");
        return;
      } else {
        // Food doesn't have sizes - add directly
        onAddToCart(food);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
      }
    }
  };

  const handleSizeConfirm = (selectedSize, selectedPrice) => {
    console.log("🎯 Size confirmed:", { selectedSize, selectedPrice, food: food.name });
    const foodWithSize = {
      ...food,
      selectedSize,
      price: Number(selectedPrice), // Ensure price is a number
      hasSizes: food.hasSizes || false, // Ensure hasSizes is set
      sizeType: food.sizeType || "standard", // Preserve sizeType (standard or half-full)
      sizes: food.sizes || null, // Ensure sizes object is included
      halfFull: food.halfFull || null, // Ensure halfFull object is included
    };
    console.log("📦 Food with size to add:", foodWithSize);
    onAddToCart(foodWithSize);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    setShowSizeModal(false);
  };

  // Calculate price range for foods with sizes
  const getPriceDisplay = () => {
    if (food.hasSizes) {
      const sizeType = food.sizeType || "standard";
      let prices = [];
      
      if (sizeType === "half-full" && food.halfFull) {
        prices = [
          food.halfFull.Half,
          food.halfFull.Full,
        ].filter((p) => p !== null && p !== undefined);
      } else if (food.sizes) {
        prices = [
          food.sizes.Small,
          food.sizes.Medium,
          food.sizes.Large,
        ].filter((p) => p !== null && p !== undefined);
      }
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
          return minPrice;
        }
        return `${minPrice} - ${maxPrice}`;
      }
    }
    return food?.price || 0;
  };

  return (
    <motion.div 
      className="relative rounded-2xl overflow-hidden h-full shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Full-screen image container */}
      <div className="absolute inset-0 w-full h-full">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        
        <motion.img
          src={food?.image || "https://via.placeholder.com/400x300"}
          alt={food?.name || "Food item"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: 'transform' }}
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {food?.name || "Unknown"}
        </motion.h3>
        
        {/* Category - with icon-like styling */}
        <motion.div 
          className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-3"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="h-px w-5 sm:w-6 bg-white/60" />
          <span className="text-[10px] sm:text-xs md:text-sm text-white/95 capitalize font-medium tracking-wide">
            {food?.category || "Category"}
          </span>
        </motion.div>
        
        {/* Advanced bottom section - price and CTA with better layout */}
        <motion.div 
          className="flex items-end justify-between gap-2 sm:gap-3 pt-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Enhanced price display */}
          <div className="flex flex-col">
            <span className="text-[7px] sm:text-[8px] md:text-[9px] text-white/70 font-medium mb-0.5 sm:mb-1 uppercase tracking-widest">
              {food?.hasSizes ? "Price Range" : "Price"}
            </span>
            <div className="flex items-baseline gap-0.5 sm:gap-1 flex-wrap">
              <span className="text-xs sm:text-sm md:text-base text-white/90 font-semibold">₹</span>
              <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-2xl leading-none">
                {getPriceDisplay()}
              </span>
            </div>
            {food?.hasSizes && (
              <span className="text-[8px] sm:text-[9px] text-white/80 mt-0.5">
                Select size
              </span>
            )}
          </div>
          
          {/* Advanced add to cart button - more intuitive design */}
          <motion.button
            onClick={handleAddToCart}
            className={`${isAdded ? successColor : buttonColor} text-white px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center gap-1 sm:gap-1.5 md:gap-2 font-semibold sm:font-bold shadow-xl hover:shadow-2xl transition-all duration-200 relative overflow-hidden min-w-[75px] sm:min-w-[100px] md:min-w-[115px] justify-center group/btn`}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 600, damping: 35, duration: 0.2 }}
            style={{ willChange: 'transform' }}
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

      {/* Size Selection Modal */}
      <SizeSelectionModal
        food={food}
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        onConfirm={handleSizeConfirm}
      />
    </motion.div>
  );
};

export default CarouselCard;

