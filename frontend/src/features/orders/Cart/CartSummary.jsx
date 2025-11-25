import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaShoppingBag } from "react-icons/fa";

const CartSummary = ({
  cart,
  total,
  handleSubmit,
  user,
}) => {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-10">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Bill Summary</h3>

      <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>₹{total.toFixed(2)}</span>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={!user}
        className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2"
      >
        <FaShoppingBag /> Place Order
      </motion.button>
    </div>
  );
};

export default CartSummary;
