import React from "react";
import { motion } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const FloatingCartButton = ({ cartCount }) => {
  const navigate = useNavigate();

  // Hide button if cart is empty (optional but recommended)
  if (!cartCount || cartCount === 0) return null;

  return (
    <motion.button
      // Ultra-fast entry animation
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.1,     // ⚡ VERY FAST
        ease: "easeOut",
      }}

      // Instant interaction feedback
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.9 }}

      className="
        fixed bottom-5 left-1/2 -translate-x-1/2
        z-50
        flex items-center gap-2
        bg-red-600 hover:bg-red-700
        text-white
        px-7 py-3
        rounded-full
        shadow-xl
        font-semibold
        cursor-pointer
        will-change-transform
        active:scale-95
        select-none
      "
      onClick={() => navigate("/order")}
    >
      <FaShoppingCart className="text-base" />
      View Cart ({cartCount})
    </motion.button>
  );
};

export default FloatingCartButton;
