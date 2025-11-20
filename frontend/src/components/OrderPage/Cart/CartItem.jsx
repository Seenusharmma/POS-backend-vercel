import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaTrashAlt } from "react-icons/fa";

const CartItem = ({ item, index, updateQuantity, removeItem }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between border-b border-gray-100 py-4"
    >
      <div className="flex items-center gap-4">
        <img
          src={item.image || "https://via.placeholder.com/100"}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-lg"
        />

        <div>
          <h3 className="font-semibold text-gray-800 text-lg">{item.name}</h3>
          <p className="text-gray-500 text-sm capitalize">
            {item.category} • {item.type}
          </p>
          <p className="text-red-600 font-bold mt-1">
            ₹{item.price * item.quantity}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(item._id, item.quantity - 1)}
            className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            –
          </button>
          <span className="font-semibold">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item._id, item.quantity + 1)}
            className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            +
          </button>
        </div>

        <button
          onClick={() => removeItem(item._id)}
          className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
        >
          <FaTrashAlt /> Remove
        </button>
      </div>
    </motion.div>
  );
};

export default CartItem;
