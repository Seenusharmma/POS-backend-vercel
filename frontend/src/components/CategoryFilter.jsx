import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const CategoryFilter = ({ categoryFilter, setCategoryFilter, categories }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 overflow-x-auto no-scrollbar">
      {categories.map((cat) => (
        <motion.button
          whileTap={{ scale: 0.9 }}
          key={cat}
          onClick={() => setCategoryFilter(cat)}
          className={`px-6 py-2 rounded-full font-semibold border text-sm sm:text-base ${
            categoryFilter === cat
              ? "bg-yellow-500 text-white border-yellow-500 shadow"
              : "border-gray-300 text-gray-700 hover:bg-yellow-50"
          }`}
        >
          {cat}
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;
