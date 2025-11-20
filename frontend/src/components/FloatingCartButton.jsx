import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa";

const FloatingCartButton = ({ cart }) => {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold cursor-pointer"
      onClick={() => (window.location.href = "/order")}
    >
      <FaShoppingCart />
      View Cart ({cart.length})
    </motion.div>
  );
};

export default FloatingCartButton;
