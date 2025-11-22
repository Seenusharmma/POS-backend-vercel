import React from "react";
import toast from "react-hot-toast";

/**
 * Individual Order Card Component
 * Displays a single order with all details and actions
 */
const OrderCard = ({
  order,
  isHighlighted,
  onStatusChange,
  onMarkPayment,
  onDeleteOrder,
  userName,
  userEmail,
}) => {
  const statusColors = {
    Pending: "text-yellow-600",
    Cooking: "text-blue-600",
    Ready: "text-purple-600",
    Served: "text-green-600",
    Completed: "text-gray-600",
  };

  return (
    <div
      className={`border rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 transition-all ${
        isHighlighted ? "bg-yellow-100" : "bg-gray-50"
      }`}
    >
      {/* Username Badge - Prominent Display */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
        <span className="text-xs sm:text-sm font-bold text-blue-700 bg-gradient-to-r from-blue-100 to-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm border border-blue-200 inline-block">
          👤 {order.userName || userName || "Guest User"}
        </span>
        <span className="text-xs text-gray-500 break-all">
          📧 {order.userEmail || userEmail}
        </span>
      </div>

      {/* Order Details */}
      <p className="font-semibold text-gray-800 text-sm sm:text-base mb-1">
        <span className={order.isInRestaurant === false ? "text-blue-600" : "text-green-600"}>
          {order.isInRestaurant === false ? "🚚 Delivery" : "🏪 Restaurant"}
        </span>
        {order.isInRestaurant === true && ` - Table ${order.tableNumber}`}: {order.foodName} ({order.type})
      </p>
      
      <p className="text-xs sm:text-sm text-gray-600 mb-2">
        Qty: {order.quantity} • ₹{order.price} •{" "}
        <span className={`font-semibold ${statusColors[order.status] || "text-gray-600"}`}>
          {order.status}
        </span>
      </p>

      {/* Payment Status and Actions */}
      <div className="flex flex-wrap gap-2 mb-2">
        {order.paymentStatus === "Paid" ? (
          <div className="flex items-center gap-2">
            <p className="text-green-600 font-semibold text-xs sm:text-sm">
              ✅ Payment Paid
            </p>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                order.paymentMethod === "Cash"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {order.paymentMethod === "Cash" ? "💵 Cash" : "📱 UPI"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-red-600 font-semibold text-xs sm:text-sm">
              💳 Payment Pending
            </p>
            <button
              onClick={() => onMarkPayment(order._id)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm"
            >
              Mark as Paid
            </button>
          </div>
        )}

        {/* Delete Order Button */}
        <button
          onClick={() => onDeleteOrder(order._id)}
          className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm"
        >
          Delete
        </button>
      </div>

      {/* Status Dropdown */}
      <div className="mt-2">
        <select
          value={order.status}
          onChange={(e) => onStatusChange(order._id, e.target.value)}
          className="border rounded p-1.5 sm:p-2 text-xs sm:text-sm w-full"
        >
          <option>Pending</option>
          <option>Cooking</option>
          <option>Ready</option>
          <option>Served</option>
          <option>Completed</option>
        </select>
      </div>
    </div>
  );
};

export default OrderCard;

