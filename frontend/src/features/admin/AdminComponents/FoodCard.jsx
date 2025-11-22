import React from "react";
import { motion } from "framer-motion";
import API_BASE from "../../../config/api";

/**
 * Food Card Component
 * Displays individual food item with image, details, and actions
 */
const FoodCard = ({ food, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <motion.div
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
          <span className="text-xs text-gray-500 font-medium">{food.category}</span>
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
              onClick={() => onEdit(food)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm hover:shadow-md"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(food._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm hover:shadow-md"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Availability Toggle - Bottom */}
        <button
          onClick={() => onToggleAvailability(food._id, !food.available)}
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
  );
};

export default FoodCard;

