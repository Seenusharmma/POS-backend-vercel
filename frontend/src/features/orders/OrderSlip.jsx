import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast, { Toaster } from "react-hot-toast";

const OrderSlip = ({ 
  isOpen, 
  onClose, 
  orders, 
  totalAmount, 
  userName,
  userEmail,
  orderDate
}) => {
  const slipRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;
  
  if (!orders || orders.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        >
          <div className="text-center">
            <p className="text-gray-600 mb-4">No order data available</p>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const total = orders.reduce((sum, order) => sum + (order.price || 0), 0);

  const formattedDate = orderDate 
    ? new Date(orderDate).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const firstOrder = orders[0] || {};
  const orderId = firstOrder._id 
    ? firstOrder._id.slice(-8).toUpperCase() 
    : firstOrder.id 
    ? firstOrder.id.slice(-8).toUpperCase()
    : "ORDER" + Date.now().toString().slice(-8);

  return (
    <>
    <Toaster />
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-800">📄 Order Slip</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Order Slip Content */}
        <div className="p-4">
          <div
            ref={slipRef}
            className="bg-white p-6 border-2 border-dashed border-gray-300 rounded-lg"
            style={{ 
              minWidth: "280px",
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-gray-800 pb-3">
              <h1 className="text-2xl font-bold">🍽️ FoodFantasy</h1>
              <p className="text-xs mt-1">Delicious Food, Delivered Fresh</p>
            </div>

            {/* Order Info */}
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-semibold">#{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-semibold">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold">{userName || "Guest"}</span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4 border-t border-b py-3">
              <h3 className="font-bold text-sm mb-2">Items:</h3>
              {orders.map((order, index) => (
                <div key={index} className="mb-2 pb-2 border-b last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {order.foodName || order.name}
                        {order.selectedSize && (
                          <span className="ml-1 text-xs text-orange-600">
                            ({order.selectedSize})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">
                        {order.type} • {order.category}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-semibold text-sm">
                        ₹{Number(order.price || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">Qty: {order.quantity || 1}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mb-4 space-y-1 text-sm">
              <div className="flex justify-between text-lg font-bold border-t-2 pt-2 mt-2">
                <span>Total:</span>
                <span className="text-red-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs border-t pt-3 text-gray-600">
              <p>Thank you for your order!</p>
              <p className="mt-1">Visit us again soon 🎉</p>
            </div>
          </div>

          {/* ❌ Removed Action Buttons Here */}
        </div>
      </motion.div>
    </div>
    </>
  );
};

export default OrderSlip;
