import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCreditCard, FaQrcode } from "react-icons/fa";
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
  tableNumber, 
  selectedChairsCount,
  isInRestaurant = true,
  user,
  socketRef: parentSocketRef,
  onPaymentComplete
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("UPI");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [createdOrders, setCreatedOrders] = useState([]);
  const navigate = useNavigate();

  const UPI_ID = "roshansharma7250-2@oksbi";
  const PAYEE_NAME = "FoodFantasy";
  const orderNote = isInRestaurant 
    ? `Order for Table ${tableNumber}` 
    : "Takeaway / Delivery Order";
  
  // Generate UPI payment link with proper encoding
  const generateUPILink = () => {
    const amount = Number(totalAmount).toFixed(2);
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: PAYEE_NAME,
      am: amount,
      cu: 'INR',
      tn: orderNote
    });
    return `upi://pay?${params.toString()}`;
  };
  
  const upiLink = generateUPILink();

  const handlePaymentConfirm = async () => {
    if (!paymentConfirmed) {
      setPaymentConfirmed(true);
      return;
    }

    // Now create orders AFTER payment is confirmed
    setIsCreatingOrder(true);
    try {
      // Ensure tableNumber is properly set (0 for takeaway, actual number for in-restaurant)
      const finalTableNumber = isInRestaurant ? Number(tableNumber) : 0;
      
      // Validate and prepare payload before sending
      const validatedPayload = cartData.map((i) => ({
        foodName: i.name || i.foodName,
        category: i.category || "Uncategorized",
        type: i.type || "Veg",
        tableNumber: finalTableNumber,
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) * Number(i.quantity) || 0,
        userId: user?.uid || "",
        userEmail: user?.email || "",
        userName: user?.displayName || "Guest User",
        paymentStatus: "Paid",
        paymentMethod: selectedPaymentMethod,
        image: i.image || "",
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

      // Show success toast
      const orderTypeText = isInRestaurant 
        ? `Table ${tableNumber} - ${selectedChairsCount} chair(s)`
        : "Takeaway / Delivery";
      toast.success(`✅ Order successful! ${orderTypeText}`, {
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
      setPaymentConfirmed(false);
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">💳 Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Order Summary */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Order Summary</h3>
              {isInRestaurant ? (
                <p className="text-sm text-gray-600">Table: {tableNumber} • Chairs: {selectedChairsCount}</p>
              ) : (
                <p className="text-sm text-gray-600">📦 Takeaway / Delivery Order</p>
              )}
              <p className="text-lg font-bold text-red-600 mt-2">
                Total: ₹{Number(totalAmount).toFixed(2)}
              </p>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Select Payment Method</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedPaymentMethod("UPI")}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === "UPI"
                      ? "border-red-600 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <FaQrcode className="text-xl text-red-600" />
                  <span className="font-medium">UPI Payment</span>
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod("Cash")}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === "Cash"
                      ? "border-red-600 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <FaCreditCard className="text-xl text-red-600" />
                  <span className="font-medium">Cash Payment</span>
                </button>
              </div>
            </div>

            {/* Payment Options */}
            {selectedPaymentMethod === "UPI" && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Scan QR Code to Pay</h3>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex flex-col items-center">
                  {/* QR Code */}
                  <div className="mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`}
                      alt="Payment QR Code"
                      className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-gray-300 rounded-lg"
                      onError={(e) => {
                        console.error("QR code generation failed");
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-center text-red-600 text-sm mt-2">
                      QR Code failed to load. Please use the payment button below.
                    </div>
                  </div>
                  
                  {/* UPI Payment Button */}
                  <button
                    onClick={() => {
                      try {
                        // Try to open UPI app directly
                        window.location.href = upiLink;
                        toast.success("Opening UPI app...");
                      } catch (error) {
                        console.error("Error opening UPI link:", error);
                        toast.error("Please install a UPI app or scan the QR code");
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors mb-2 w-full"
                  >
                    💰 Pay ₹{Number(totalAmount).toFixed(2)} via UPI
                  </button>
                  
                  {/* Alternative: Copy UPI ID */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(UPI_ID).then(() => {
                        toast.success("UPI ID copied to clipboard!");
                      }).catch(() => {
                        toast.error("Failed to copy UPI ID");
                      });
                    }}
                    className="text-xs text-gray-600 hover:text-gray-800 underline mb-2"
                  >
                    Copy UPI ID: {UPI_ID}
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Scan the QR code with your UPI app or click the button to open UPI app
                  </p>
                  
                  {/* Display UPI Details */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full text-left">
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-semibold">UPI ID:</span> {UPI_ID}
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-semibold">Amount:</span> ₹{Number(totalAmount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Note:</span> {orderNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod === "Cash" && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  💵 Please pay ₹{Number(totalAmount).toFixed(2)} in cash to the staff.
                </p>
              </div>
            )}

            {/* Payment Confirmation */}
            {!paymentConfirmed ? (
              <button
                onClick={handlePaymentConfirm}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold text-base sm:text-lg transition-colors"
              >
                I Have Made the Payment
              </button>
            ) : (
              <div className="space-y-3">
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
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-green-700 font-semibold mb-2">
                        ✅ Payment Confirmed!
                      </p>
                      <p className="text-sm text-gray-600">
                        Click below to place your order
                      </p>
                    </div>
                    <button
                      onClick={handlePaymentConfirm}
                      disabled={isCreatingOrder}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold text-base sm:text-lg transition-colors"
                    >
                      Place Order
                    </button>
                  </>
                )}
              </div>
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
      tableNumber={tableNumber}
      selectedChairsCount={selectedChairsCount}
      isInRestaurant={isInRestaurant}
      userName={user?.displayName || "Guest User"}
      userEmail={user?.email || ""}
      orderDate={createdOrders[0]?.createdAt || new Date()}
    />
    </>
  );
};

export default PaymentModal;

