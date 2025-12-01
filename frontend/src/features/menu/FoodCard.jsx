import React, { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import toast from "react-hot-toast";
import SizeSelectionModal from "../../components/common/SizeSelectionModal";

const FoodCard = ({ food, addToCart }) => {
  const [showSizeModal, setShowSizeModal] = useState(false);

  const handleAddClick = () => {
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
      addToCart(food);
    }
  };

  const handleSizeConfirm = (selectedSize, selectedPrice) => {
    const foodWithSize = {
      ...food,
      selectedSize,
      price: Number(selectedPrice), // Ensure price is a number
      hasSizes: food.hasSizes || false, // Ensure hasSizes is set
      sizeType: food.sizeType || "standard", // Preserve sizeType (standard or half-full)
      sizes: food.sizes || null, // Ensure sizes object is included
      halfFull: food.halfFull || null, // Ensure halfFull object is included
    };
    addToCart(foodWithSize);
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
          return `₹${minPrice}`;
        }
        return `₹${minPrice} - ₹${maxPrice}`;
      }
    }
    return `₹${food.price}`;
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="bg-white border rounded-2xl shadow-md hover:shadow-xl overflow-hidden flex flex-col"
      >
        <div className="relative">
          <img
            src={food.image || "https://via.placeholder.com/400x300"}
            alt={food.name}
            className="w-full h-48 object-cover"
          />

          <span
            className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-md ${
              food.type === "Veg"
                ? "bg-green-100 text-green-700 border border-green-500"
                : "bg-red-100 text-red-700 border border-red-500"
            }`}
          >
            {food.type}
          </span>
          
          {food.hasSizes && (
            <span className="absolute top-3 right-3 text-xs px-2 py-1 rounded-md bg-orange-100 text-orange-700 border border-orange-500 font-semibold">
              Sizes Available
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-bold text-gray-800 text-lg">{food.name}</h3>
          <p className="text-sm text-gray-500 capitalize mb-2">
            {food.category}
          </p>

          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <FaStar />
            <span className="text-gray-700 text-sm">
              {food.rating || "4.3"} • {Math.floor(Math.random() * 30 + 10)} min
            </span>
          </div>

          <div className="flex justify-between items-center mt-auto">
            <div>
              <span className="text-lg font-bold text-red-600">
                {getPriceDisplay()}
              </span>
              {food.hasSizes && (
                <p className="text-xs text-gray-500 mt-0.5">Select size</p>
              )}
            </div>

            <button
              onClick={handleAddClick}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1"
            >
              <FaShoppingCart /> Add
            </button>
          </div>
        </div>
      </motion.div>

      <SizeSelectionModal
        food={food}
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        onConfirm={handleSizeConfirm}
      />
    </>
  );
};

export default FoodCard;
