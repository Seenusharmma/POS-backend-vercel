import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaChair } from "react-icons/fa";
import axios from "axios";
import API_BASE from "../../config/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import OrderSlip from "./OrderSlip";

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  cartData, 
  totalAmount, 
  user,
  socketRef: parentSocketRef,
  onPaymentComplete,
  selectedTables = [],
  contactNumber: propContactNumber = ""
}) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [createdOrders, setCreatedOrders] = useState([]);
  const navigate = useNavigate();
  const audioRef = useRef(null);

  // 🔊 Play order sound
  const playOrderSound = () => {
    try {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio("/order.mp3");
        audioRef.current.volume = 0.7; // Set volume to 70%
      }
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        // Suppress autoplay errors (browser may block autoplay)
        console.warn("Could not play order sound:", error);
      });
    } catch (error) {
      console.warn("Error playing order sound:", error);
    }
  };

  const handlePlaceOrder = async () => {
    setIsCreatingOrder(true);
    try {
      // Validate and prepare payload before sending
      const hasTables = selectedTables && selectedTables.length > 0;
      const primaryTable = hasTables ? selectedTables[0] : null;
      
      const validatedPayload = cartData.map((i) => ({
        foodName: i.name || i.foodName,
        category: i.category || "Uncategorized",
        type: i.type || "Veg",
        tables: selectedTables, // New field for multiple tables
        tableNumber: primaryTable ? primaryTable.tableNumber : 0, // Backward compatibility
        chairsBooked: primaryTable ? primaryTable.chairsBooked : 0, // Backward compatibility
        chairIndices: primaryTable ? primaryTable.chairIndices : [], // Backward compatibility
        chairLetters: primaryTable ? primaryTable.chairLetters : "", // Backward compatibility
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) * Number(i.quantity) || 0,
        userId: user?.uid || "",
        userEmail: user?.email || "",
        userName: user?.displayName || "Guest User",
        image: i.image || "",
        selectedSize: i.selectedSize || null,
        isInRestaurant: hasTables, // true if table selected, false for delivery
        contactNumber: propContactNumber || "", // Phone number for parcel/delivery orders
        deliveryLocation: null,
      }));

      console.log("Sending order payload:", validatedPayload); // Debug log
      
      const response = await axios.post(`${API_BASE}/api/orders/create-multiple`, validatedPayload);
      
      console.log("Order creation response:", response.data); // Debug log
      
      // Store created orders for order slip
      const orders = response.data.orders || [];
      console.log("Created orders for slip:", orders); // Debug log
      setCreatedOrders(orders);
      
      // Socket events are already emitted by backend when orders are created
      // Backend automatically emits "newOrderPlaced" for each order
      // No need to emit from frontend - backend is the single source of truth

      // 🔊 Play order sound
      playOrderSound();

      // Show success toast
      toast.success(`✅ Order successful!`, {
        duration: 4000,
        icon: '🎉',
      });
      
      // Close payment modal first, then show order slip
      setIsCreatingOrder(false);
      onClose(); // Close payment modal
      
      // Show order slip after a short delay to ensure modal closes
      setTimeout(() => {
        setShowOrderSlip(true);
      }, 300);
      
      // Call payment complete handler to clear cart
      if (onPaymentComplete) {
        onPaymentComplete();
      }
    } catch (error) {
      console.error("Error creating order after payment:", error);
      
      // Provide more detailed error message
      let errorMessage = "Failed to place order! Please try again.";
      if (error.response) {
        // Server responded with error status
        const serverError = error.response.data;
        errorMessage = serverError?.message || `Server error: ${error.response.status}`;
        console.error("Server error details:", serverError);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your connection and try again.";
        console.error("Network error:", error.request);
      } else {
        // Something else happened
        errorMessage = error.message || "An unexpected error occurred.";
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-center",
      });
      setIsCreatingOrder(false);
    }
  };

  // Show payment modal only if isOpen is true
  // Show order slip independently
  return (
    <>
    {isOpen && (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Place Order</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Table Selection Display */}
            {selectedTables.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FaChair className="text-red-600" />
                    <span className="text-sm font-bold text-red-700">
                      Selected Tables:
                    </span>
                  </div>
                  {selectedTables.map((table, idx) => (
                    <div key={idx} className="text-sm text-gray-700 ml-6">
                      • Table {table.tableNumber} ({table.chairLetters || `${table.chairsBooked} seats`})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phone Number Display for Parcel/Delivery */}
            {selectedTables.length === 0 && propContactNumber && (
              <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-700">
                    📞 Contact: {propContactNumber}
                  </span>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Order Summary</h3>
              <p className="text-lg font-bold text-red-600 mt-2">
                Total: ₹{Number(totalAmount).toFixed(2)}
              </p>
            </div>

            {/* Place Order Button */}
            {isCreatingOrder ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-700 font-semibold mb-2">
                  ⏳ Placing your order...
                </p>
                <p className="text-sm text-gray-600">
                  Please wait while we process your order
                </p>
              </div>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={isCreatingOrder}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold text-base sm:text-lg transition-colors"
              >
                Place Order
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
    )}
    {/* Order Slip Modal */}
    <OrderSlip
      isOpen={showOrderSlip}
      onClose={() => {
        setShowOrderSlip(false);
        onClose();
        setTimeout(() => {
          navigate("/admin");
        }, 300);
      }}
      orders={createdOrders}
      totalAmount={totalAmount}
      userName={user?.displayName || "Guest User"}
      userEmail={user?.email || ""}
      orderDate={createdOrders[0]?.createdAt || new Date()}
    />
    </>
  );
};

export default PaymentModal;

