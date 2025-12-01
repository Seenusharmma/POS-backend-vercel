import React from "react";
import { motion } from "framer-motion";
import API_BASE from "../../../config/api";

/**
 * Responsive Food Card Component
 * Optimized for mobile + tablets + desktops
 */
const FoodCard = ({ food, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className="
        bg-white 
        rounded-xl 
        shadow-md 
        hover:shadow-lg 
        transition-all 
        duration-300 
        overflow-hidden 
        border 
        border-gray-100
      "
    >
      {/* Image Section */}
      <div className="relative 
                      h-32        /* mobile height */
                      sm:h-40     /* bigger tablets */
                      md:h-44 
                      overflow-hidden 
                      bg-gray-50">
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
            e.target.src =
              "https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image";
          }}
        />

        {/* Veg/Non-Veg Badge */}
        <div className="absolute top-2 right-2">
          <div
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md ${
              food.type === "Veg"
                ? "bg-green-600"
                : food.type === "Non-Veg"
                ? "bg-red-600"
                : "bg-gray-500"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {!food.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4">
        {/* Food name */}
        <h3 className="font-bold 
                      text-sm sm:text-lg 
                      text-gray-900 
                      mb-1 
                      line-clamp-2
                      min-h-[2rem] sm:min-h-[2.8rem]">
          {food.name}
        </h3>

        {/* Category */}
        <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
          {food.category}
        </span>

        {/* Price Section */}
        <div className="flex items-start justify-between pt-2 mt-1 border-t border-gray-100">

          {/* Price details */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 mb-0.5">Price</p>

            {food.hasSizes ? (
              <div className="space-y-1">
                {/* Half & Full */}
                {food.sizeType === "half-full" && food.halfFull ? (
                  <div className="space-y-0.5">
                    {food.halfFull.Half && (
                      <p className="text-xs sm:text-sm text-gray-700">
                        <span className="font-semibold">Half:</span> ₹
                        {Number(food.halfFull.Half).toFixed(0)}
                      </p>
                    )}
                    {food.halfFull.Full && (
                      <p className="text-xs sm:text-sm text-gray-700">
                        <span className="font-semibold">Full:</span> ₹
                        {Number(food.halfFull.Full).toFixed(0)}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Standard size (S/M/L) */
                  <div className="space-y-0.5">
                    {food.sizes?.Small && (
                      <p className="text-xs sm:text-sm text-gray-700">
                        <span className="font-semibold">Small:</span> ₹
                        {Number(food.sizes.Small).toFixed(0)}
                      </p>
                    )}
                    {food.sizes?.Medium && (
                      <p className="text-xs sm:text-sm text-gray-700">
                        <span className="font-semibold">Medium:</span> ₹
                        {Number(food.sizes.Medium).toFixed(0)}
                      </p>
                    )}
                    {food.sizes?.Large && (
                      <p className="text-xs sm:text-sm text-gray-700">
                        <span className="font-semibold">Large:</span> ₹
                        {Number(food.sizes.Large).toFixed(0)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Simple price */
              <p className="font-bold text-base sm:text-xl text-gray-900">
                ₹{Number(food.price || 0).toFixed(0)}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Edit Btn */}
            <button
              onClick={() => onEdit(food)}
              className="
                bg-orange-500 hover:bg-orange-600 text-white 
                px-2 sm:px-3 
                py-1.5 sm:py-1.5
                rounded-md 
                text-[10px] sm:text-xs 
                font-semibold 
                shadow-sm hover:shadow-md
              "
            >
              Edit
            </button>

            {/* Delete Btn */}
            <button
              onClick={() => onDelete(food._id)}
              className="
                bg-red-500 hover:bg-red-600 text-white 
                px-2 sm:px-3 
                py-1.5 sm:py-1.5
                rounded-md 
                text-[10px] sm:text-xs 
                font-semibold 
                shadow-sm hover:shadow-md
              "
            >
              Delete
            </button>

          </div>
        </div>

        {/* Availability Button */}
        <button
          onClick={() => onToggleAvailability(food._id, !food.available)}
          className={`
            w-full mt-2 
            py-1.5 sm:py-2 
            rounded-md 
            font-semibold 
            text-[11px] sm:text-xs
            transition-all
            ${
              food.available
                ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
            }
          `}
        >
          {food.available ? "✓ Available" : "✗ Out of Stock"}
        </button>
      </div>
    </motion.div>
  );
};

export default FoodCard;
