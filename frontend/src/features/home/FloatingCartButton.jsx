import React from "react";
import { motion } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa";

const FloatingCartButton = ({ cartCount }) => {
  if (cartCount === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-20 lg:bottom-6 left-1/2 transform -translate-x-1/2 
                 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
                 text-white px-5 lg:px-6 py-2.5 lg:py-3 rounded-full shadow-lg hover:shadow-xl 
                 flex items-center gap-2 text-sm lg:text-base font-semibold cursor-pointer z-50 
                 border border-orange-400/30 transition-all duration-200"
      onClick={() => (window.location.href = "/order")}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <FaShoppingCart className="text-sm" />
      <span>View Cart</span>
      <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold">
        {cartCount}
      </span>
    </motion.div>
  );
};

export default FloatingCartButton;

