import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import FoodCard from "./FoodCard";

const FoodGrid = ({ foods, addToCart }) => {
  return (
    <div className="px-4 sm:px-10 py-10">
      {foods.length === 0 ? (
        <p className="text-center text-gray-600 mt-12 text-lg">
          No foods match your selection 🍴
        </p>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {foods.map((food) => (
            <FoodCard key={food._id} food={food} addToCart={addToCart} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default FoodGrid;
