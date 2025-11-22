import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const TypeFilter = ({ typeFilter, setTypeFilter }) => {
  const types = ["All", "Veg", "Non-Veg"];

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {types.map((type) => (
        <motion.button
          whileTap={{ scale: 0.9 }}
          key={type}
          onClick={() => setTypeFilter(type)}
          className={`px-6 py-2 rounded-full font-semibold border text-sm sm:text-base ${
            typeFilter === type
              ? "bg-red-600 text-white border-red-600 shadow"
              : "border-gray-300 text-gray-700 hover:bg-red-50"
          }`}
        >
          {type === "Veg" ? "🌿 Veg" : type === "Non-Veg" ? "🍗 Non-Veg" : "🍴 All"}
        </motion.button>
      ))}
    </div>
  );
};

export default TypeFilter;
