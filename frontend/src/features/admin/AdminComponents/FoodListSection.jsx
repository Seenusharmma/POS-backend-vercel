import React from "react";
import { motion } from "framer-motion";
import FoodCard from "./FoodCard";

/**
 * Food List Section Component
 * Displays grid of food items
 */
const FoodListSection = ({ foods, filteredFoods, onEdit, onDelete, onToggleAvailability }) => {
  if (filteredFoods.length === 0) {
    return (
      <motion.div
        key="foods"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No foods available yet.</p>
          <p className="text-gray-400 text-sm mt-2">Add your first food item to get started!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="foods"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {filteredFoods.map((food) => (
          <FoodCard
            key={food._id}
            food={food}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleAvailability={onToggleAvailability}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default FoodListSection;

