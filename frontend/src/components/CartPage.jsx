import React, { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaTrashAlt, FaShoppingBag } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  // 💾 Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      setCart(parsed);
      calculateTotal(parsed);
    }
  }, []);

  // 🧮 Recalculate total when cart changes
  const calculateTotal = (items) => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const gst = subtotal * 0.05;
    setTotal(subtotal + gst);
  };

  const updateQuantity = (id, newQty) => {
    let updatedCart = [...cart];
    updatedCart = updatedCart.map((item) =>
      item._id === id
        ? { ...item, quantity: Math.max(newQty, 1) }
        : item
    );
    setCart(updatedCart);
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    calculateTotal(updatedCart);
  };

  const removeItem = (id) => {
    const updated = cart.filter((i) => i._id !== id);
    setCart(updated);
    localStorage.setItem("cartItems", JSON.stringify(updated));
    calculateTotal(updated);
    toast.success("Item removed from cart 🗑️");
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) return toast.error("Your cart is empty!");
    toast.success("Proceeding to checkout...");
    navigate("/order"); // redirect to OrderPage
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff8f3] to-white py-12 px-4 sm:px-10">
      <Toaster />
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center mb-10"
      >
        🛒 Your Cart
      </motion.h1>

      {cart.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500 mt-20"
        >
          <p className="text-lg">Your cart is empty 🍽️</p>
          <button
            onClick={() => navigate("/menu")}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold"
          >
            Browse Menu
          </button>
        </motion.div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 🧺 Cart Items */}
          <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6">
            {cart.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between border-b border-gray-100 py-4"
              >
                {/* Image & Details */}
                <div className="flex items-center gap-4">
                  <img
                    src={item.image || "https://via.placeholder.com/100"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {item.name}
                    </h3>
                    <p className="text-gray-500 text-sm capitalize">
                      {item.category} • {item.type}
                    </p>
                    <p className="text-red-600 font-bold mt-1">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full font-bold text-lg hover:bg-gray-300"
                    >
                      −
                    </button>
                    <span className="text-gray-700 font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full font-bold text-lg hover:bg-gray-300"
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
            ))}
          </div>

          {/* 💳 Bill Summary */}
          <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-10 h-fit">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Bill Summary
            </h3>
            <div className="flex justify-between text-gray-700 mb-2">
              <span>Subtotal</span>
              <span>
                ₹
                {cart
                  .reduce((sum, i) => sum + i.price * i.quantity, 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-700 mb-2">
              <span>GST (5%)</span>
              <span>
                ₹
                {(
                  cart.reduce((sum, i) => sum + i.price * i.quantity, 0) * 0.05
                ).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-800 text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handlePlaceOrder}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2"
            >
              <FaShoppingBag /> Place Order
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
