import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaReceipt,
  FaChevronDown,
  FaChevronUp,
  FaShare,
  FaCheckCircle,
  FaClock,
  FaStore,
  FaHome,
  FaMapMarkerAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

const OrderHistoryCard = ({ orderGroup, onViewSlip }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const firstOrder = orderGroup[0];
  const totalAmount = orderGroup.reduce((sum, o) => sum + (o.price || 0), 0);
  const orderDate = new Date(firstOrder.createdAt);
  const orderId = firstOrder._id?.slice(-8).toUpperCase() || "ORDER";

  // Handle share
  const handleShare = async () => {
    const shareText = `Order #${orderId} from FoodFantasy\nTotal: ₹${totalAmount.toFixed(2)}\nDate: ${orderDate.toLocaleDateString()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order #${orderId}`,
          text: shareText,
        });
        toast.success("Order shared!");
      } catch (error) {
        if (error.name !== "AbortError") {
          // Fallback to clipboard
          navigator.clipboard.writeText(shareText);
          toast.success("Order details copied to clipboard!");
        }
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText);
      toast.success("Order details copied to clipboard!");
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Complete":
        return "bg-green-100 text-green-700";
      case "Paid":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-base sm:text-lg text-gray-800">
                Order #{orderId}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                  firstOrder.status
                )}`}
              >
                {firstOrder.status}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {orderDate.toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-red-600">
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3 pb-3 border-b border-gray-200">
          <span className="hidden sm:inline text-gray-300">|</span>
          <span>
            {orderGroup.length} item{orderGroup.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors"
          >
            <FaShare className="text-xs" />
            Share
          </button>
          <button
            onClick={() => onViewSlip(orderGroup)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors"
          >
            <FaReceipt className="text-xs" />
            Receipt
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold transition-colors ml-auto"
          >
            {isExpanded ? (
              <>
                <FaChevronUp className="text-xs" />
                Less
              </>
            ) : (
              <>
                <FaChevronDown className="text-xs" />
                Details
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-gray-200 bg-gray-50"
          >
            <div className="p-4 sm:p-5 space-y-3">
              {/* Order Items */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {orderGroup.map((order) => (
                    <div
                      key={order._id}
                      className="flex justify-between items-start bg-white p-2 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">
                          {order.foodName}
                          {order.selectedSize && (
                            <span className="ml-1 text-xs text-orange-600 font-semibold">
                              ({order.selectedSize})
                            </span>
                          )}
                          {" "}× {order.quantity}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {order.category} • {order.type}
                        </p>
                      </div>
                      <span className="font-semibold text-sm text-gray-700 ml-2">
                        ₹{Number(order.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Timeline</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-gray-400" />
                    <span>Placed: {orderDate.toLocaleString()}</span>
                  </div>
                  {firstOrder.completedAt && (
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500" />
                      <span>
                        Completed:{" "}
                        {new Date(firstOrder.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address (if delivery) */}
              {firstOrder.isInRestaurant === false && firstOrder.deliveryLocation && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Delivery Address</h4>
                  <div className="flex items-start gap-2 text-xs text-gray-600 bg-white p-2 rounded-lg">
                    <FaMapMarkerAlt className="text-blue-500 mt-0.5" />
                    <span>
                      {firstOrder.deliveryLocation.address ||
                        `${firstOrder.deliveryLocation.latitude?.toFixed(4)}, ${firstOrder.deliveryLocation.longitude?.toFixed(4)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Summary</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-red-600">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrderHistoryCard;

