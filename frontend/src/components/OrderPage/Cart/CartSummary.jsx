import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaShoppingBag } from "react-icons/fa";
import TableSelect from "../Tables/TableSelect";

const CartSummary = ({
  cart,
  total,
  tableNumber,
  setTableNumber,
  availableTables,
  handleSubmit,
  user,
}) => {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const gst = subtotal * 0.05;

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-10">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Bill Summary</h3>

      <TableSelect
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        availableTables={availableTables}
      />

      <div className="flex justify-between text-gray-700 mb-1">
        <span>Subtotal</span>
        <span>₹{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-gray-700 mb-1">
        <span>GST (5%)</span>
        <span>₹{gst.toFixed(2)}</span>
      </div>

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
