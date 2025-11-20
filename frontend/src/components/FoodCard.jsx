import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaShoppingCart, FaStar } from "react-icons/fa";

const FoodCard = ({ food, addToCart }) => {
  return (
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
          <span className="text-lg font-bold text-red-600">
            ₹{food.price}
          </span>

          <button
            onClick={() => addToCart(food)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1"
          >
            <FaShoppingCart /> Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FoodCard;
