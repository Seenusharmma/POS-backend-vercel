import React from "react";
import { motion } from "framer-motion";
import { FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import API_BASE from "../../../config/api";

/**
 * Compact Food Card Component - Swiggy-inspired
 * Optimized for mobile + tablets + desktops
 */
const FoodCard = ({ food, onEdit, onDelete, onToggleAvailability }) => {
  // Format price display
  const getPriceDisplay = () => {
    if (food.hasSizes) {
      if (food.sizeType === "standard" && food.sizes) {
        const prices = [food.sizes.Small, food.sizes.Medium, food.sizes.Large].filter(Boolean);
        if (prices.length > 0) {
          return `₹${Math.min(...prices)} - ₹${Math.max(...prices)}`;
        }
      } else if (food.sizeType === "half-full" && food.halfFull) {
        const prices = [food.halfFull.Half, food.halfFull.Full].filter(Boolean);
        if (prices.length > 0) {
          return `₹${Math.min(...prices)} - ₹${Math.max(...prices)}`;
        }
      }
    }
    return food.price ? `₹${food.price}` : "Price not set";
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="
        bg-white 
        rounded-xl
        sm:rounded-2xl
        shadow-sm 
        hover:shadow-lg 
        transition-all 
        duration-300 
        overflow-hidden 
        border 
        border-gray-100
        group
        flex flex-col
        h-full
      "
    >
      {/* Image Section */}
      <div className="relative h-36 sm:h-40 md:h-48 overflow-hidden bg-gray-100">
        <img
          src={
            food.image && food.image.startsWith("http")
              ? food.image
              : food.image
              ? `${API_BASE}${food.image}`
              : "https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image"
          }
          alt={food.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.src =
              "https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image";
          }}
        />

        {/* Veg/Non-Veg Badge */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
          <div
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center shadow-md border-2 border-white ${
              food.type === "Veg"
                ? "bg-white"
                : food.type === "Non-Veg"
                ? "bg-white"
                : "bg-gray-50"
            }`}
          >
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm ${
               food.type === "Veg" ? "bg-green-600 border border-green-600" : 
               food.type === "Non-Veg" ? "bg-red-600 border border-red-600" : "bg-gray-500"
            }`}></div>
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {!food.available && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-white text-gray-900 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide shadow-md">
              Out of Stock
            </span>
          </div>
        )}
        
        {/* Quick Actions Overlay - Desktop Only */}
        <div className="hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center gap-2 sm:gap-3">
           <button
              onClick={() => onEdit(food)}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-lg transform hover:scale-110"
              title="Edit"
           >
              <FaEdit className="text-xs sm:text-sm" />
           </button>
           <button
              onClick={() => onDelete(food._id)}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg transform hover:scale-110"
              title="Delete"
           >
              <FaTrash className="text-xs sm:text-sm" />
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        {/* Category Badge */}
        <span className="text-[9px] sm:text-[10px] font-bold text-orange-500 uppercase tracking-wide bg-orange-50 px-1.5 sm:px-2 py-0.5 rounded mb-1.5 sm:mb-2 inline-block w-fit">
          {food.category}
        </span>

        {/* Food Name */}
        <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-800 leading-tight line-clamp-2 mb-2 min-h-[2.5rem] sm:min-h-[3rem]">
          {food.name}
        </h3>

        {/* Price */}
        <div className="mt-auto">
          <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
            {getPriceDisplay()}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
            {/* Mobile: Show all buttons */}
            <div className="sm:hidden flex gap-1.5">
              <button
                onClick={() => onEdit(food)}
                className="flex-1 px-2 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1"
              >
                <FaEdit className="text-xs" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => onToggleAvailability(food._id)}
                className={`px-2 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1 ${
                  food.available
                    ? "bg-red-50 hover:bg-red-100 text-red-600"
                    : "bg-green-50 hover:bg-green-100 text-green-600"
                }`}
              >
                {food.available ? (
                  <>
                    <FaTimes className="text-xs" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <FaCheck className="text-xs" />
                    <span>Show</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onDelete(food._id)}
                className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold text-xs transition-all"
                title="Delete"
              >
                <FaTrash className="text-xs" />
              </button>
            </div>

            {/* Desktop: Toggle availability button */}
            <button
              onClick={() => onToggleAvailability(food._id)}
              className={`hidden sm:flex w-full px-3 py-2 rounded-lg font-semibold text-sm transition-all items-center justify-center gap-2 ${
                food.available
                  ? "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                  : "bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200"
              }`}
            >
              {food.available ? (
                <>
                  <FaCheck />
                  <span>Available</span>
                </>
              ) : (
                <>
                  <FaTimes />
                  <span>Unavailable</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FoodCard;
