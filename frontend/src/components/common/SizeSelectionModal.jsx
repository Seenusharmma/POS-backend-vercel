import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const SizeSelectionModal = ({ food, isOpen, onClose, onConfirm }) => {
  const [selectedSize, setSelectedSize] = useState(null);

  if (!food || !food.hasSizes) return null;

  // Determine which size type to use
  const sizeType = food.sizeType || "standard";
  const isHalfFull = sizeType === "half-full";

  // Get sizes and prices based on sizeType
  const sizes = isHalfFull ? ["Half", "Full"] : ["Small", "Medium", "Large"];
  const sizePrices = isHalfFull
    ? {
        Half: food.halfFull?.Half,
        Full: food.halfFull?.Full,
      }
    : {
        Small: food.sizes?.Small,
        Medium: food.sizes?.Medium,
        Large: food.sizes?.Large,
      };

  const handleConfirm = () => {
    if (!selectedSize) {
      return;
    }
    const selectedPrice = sizePrices[selectedSize];
    
    if (!selectedPrice || selectedPrice === null || selectedPrice === undefined) {
      console.error("❌ Invalid price for selected size:", selectedSize);
      return;
    }
    
    onConfirm(selectedSize, Number(selectedPrice)); // Ensure price is a number
    setSelectedSize(null);
  };

  const handleClose = () => {
    setSelectedSize(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            transition={{ duration: 0.15 }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{food.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{food.category}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-600" />
                </button>
              </div>

              {/* Food Image */}
              {food.image && (
                <div className="p-4">
                  <img
                    src={food.image}
                    alt={food.name}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                </div>
              )}

              {/* Size Selection */}
              <div className="p-4 space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Select Size
                </h4>
                <div className="space-y-3">
                  {sizes.map((size) => {
                    const price = sizePrices[size];
                    if (!price) return null; // Don't show sizes without price

                    const isSelected = selectedSize === size;
                    return (
                      <motion.button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-orange-500 bg-orange-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 bg-white rounded-full"
                                />
                              )}
                            </div>
                            <span className="font-semibold text-gray-800 text-lg">
                              {size}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-orange-600">
                            ₹{price}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
                <button
                  onClick={handleConfirm}
                  disabled={!selectedSize}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                    selectedSize
                      ? "bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-xl"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {selectedSize
                    ? `Add to Cart - ₹${sizePrices[selectedSize]}`
                    : "Select a size"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SizeSelectionModal;

