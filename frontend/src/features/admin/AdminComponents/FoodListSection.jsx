import React from "react";
import { motion } from "framer-motion";
import FoodCard from "./FoodCard";

const FoodListSection = ({
  foods,
  filteredFoods,
  onEdit,
  onDelete,
  onToggleAvailability,
}) => {
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
          <p className="text-gray-400 text-sm mt-2">
            Add your first food item to get started!
          </p>
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
      className="w-full"
    >
      <div
        className="
          grid
          grid-cols-2           /* Mobile screens */
          sm:grid-cols-2         /* Small screens */
          md:grid-cols-3         /* Tablets */
          lg:grid-cols-4         /* Laptops */
          xl:grid-cols-5         /* Desktops */
          2xl:grid-cols-6        /* Ultra wide */
          gap-3
          sm:gap-4
          md:gap-5
        "
      >
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
