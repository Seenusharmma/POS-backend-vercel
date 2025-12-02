import React from "react";
import { motion } from "framer-motion";
import FoodCard from "./FoodCard";
import { FaUtensils } from "react-icons/fa";

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
        key="foods-empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-xl rounded-2xl p-12 text-center border border-gray-100"
      >
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaUtensils className="text-4xl text-orange-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          No Food Items Found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Try adjusting your search or add new items to your menu.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="foods-list"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-orange-100 rounded-lg">
             <FaUtensils className="text-orange-600 text-xl" />
           </div>
           <h3 className="text-2xl font-bold text-gray-800">
             Menu Items
           </h3>
           <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
             {filteredFoods.length}
           </span>
        </div>
      </div>

      <div
        className="
          grid
          grid-cols-2            /* Mobile: 2 cols */
          sm:grid-cols-3         /* Small screens: 3 cols */
          md:grid-cols-3         /* Tablets: 3 cols */
          lg:grid-cols-4         /* Laptops: 4 cols */
          xl:grid-cols-5         /* Desktops: 5 cols */
          2xl:grid-cols-6        /* Large desktops: 6 cols */
          gap-2                  /* Mobile: tight spacing */
          sm:gap-3               /* Small screens */
          md:gap-4               /* Medium screens */
        "
      >
        {filteredFoods.map((food, idx) => (
          <motion.div
            key={food._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <FoodCard
              food={food}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleAvailability={onToggleAvailability}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FoodListSection;
