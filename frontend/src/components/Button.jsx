import React from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const Button = () => {
  return (
    <div className="flex items-center justify-start">
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Link
          to="/menu"
          className="bg-orange-500 border border-orange-400 h-[50px] px-6 py-2 
                     text-white text-lg font-bold rounded-lg 
                     shadow-md hover:bg-orange-600 transition-colors"
        >
          View Menu
        </Link>
      </motion.div>
    </div>
  );
};

export default Button;
