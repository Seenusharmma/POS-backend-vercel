import React from "react";
import { FaChair, FaPhone, FaClock, FaTrashAlt } from "react-icons/fa";

/**
 * Grouped Order Card Component
 * Displays a group of orders placed at the same time by the same user
 */
const GroupedOrderCard = ({
  orders,
  onStatusChange,
  onDeleteOrder,
  userName,
  userEmail,
}) => {
  if (!orders || orders.length === 0) return null;

  // Get common details from the first order
  const firstOrder = orders[0];
  const orderDate = new Date(firstOrder.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const statusColors = {
    Pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
    Cooking: "text-blue-600 bg-blue-50 border-blue-200",
    Ready: "text-purple-600 bg-purple-50 border-purple-200",
    Served: "text-green-600 bg-green-50 border-green-200",
    Completed: "text-gray-600 bg-gray-50 border-gray-200",
  };

  // Helper function to get chair letters
  const getChairDisplay = (order) => {
    if (order.chairLetters && typeof order.chairLetters === 'string' && order.chairLetters.trim() !== '') {
      const letters = order.chairLetters.trim();
      if (letters.includes(' ')) return letters;
      if (letters.length > 1) return letters.split('').join(' ');
      return letters;
    }
    if (order.chairIndices && Array.isArray(order.chairIndices) && order.chairIndices.length > 0) {
      const sortedIndices = [...order.chairIndices].sort((a, b) => a - b);
      return sortedIndices.map(idx => String.fromCharCode(97 + idx)).join(' ');
    }
    if (order.chairsBooked && order.chairsBooked > 0) {
      return `${order.chairsBooked} seat${order.chairsBooked > 1 ? "s" : ""}`;
    }
    return '';
  };

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm bg-white mb-4 overflow-hidden">
      {/* 🏷️ Header - User & Location Info */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">
              👤 {userName || firstOrder.userName || "Guest User"}
            </span>
            <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
              <FaClock className="text-[10px]" /> {orderDate}
            </span>
          </div>
          <span className="text-xs text-gray-500">📧 {userEmail || firstOrder.userEmail}</span>
        </div>

        {/* Location Badge */}
        {(() => {
          const hasTable = firstOrder.tableNumber && firstOrder.tableNumber > 0;
          const hasContact = firstOrder.contactNumber && firstOrder.contactNumber.trim() !== '';
          const chairDisplay = getChairDisplay(firstOrder);
          
          if (hasTable) {
            return (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-pink-50 border border-red-200 rounded-lg">
                <FaChair className="text-red-600 text-sm" />
                <span className="text-xs font-bold text-red-700">
                  Table {firstOrder.tableNumber}
                  {chairDisplay ? ` (${chairDisplay})` : ''}
                </span>
              </div>
            );
          } else if (hasContact) {
            return (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <FaPhone className="text-blue-600 text-sm" />
                <span className="text-xs font-bold text-blue-700">
                  📞 {firstOrder.contactNumber}
                </span>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* 📋 Order Items List */}
      <div className="divide-y divide-gray-100">
        {orders.map((order) => {
          const itemTime = new Date(order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          
          return (
            <div key={order._id} className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between hover:bg-gray-50 transition-colors">
              {/* Item Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-gray-800 text-sm sm:text-base">
                    {order.foodName}
                  </span>
                  {order.selectedSize && (
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                      {order.selectedSize}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">
                    {order.type}
                  </span>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <FaClock className="text-[8px]" /> {itemTime}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  Qty: <span className="font-semibold text-gray-700">{order.quantity}</span> • 
                  Price: <span className="font-semibold text-gray-700">₹{order.price}</span>
                </div>
              </div>

              {/* Actions & Status */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Status Select */}
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order._id, e.target.value)}
                  className={`text-xs sm:text-sm font-semibold px-2 py-1.5 rounded-lg border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300 ${statusColors[order.status] || "text-gray-600 border-gray-300"}`}
                >
                  <option>Pending</option>
                  <option>Cooking</option>
                  <option>Ready</option>
                  <option>Served</option>
                  <option>Completed</option>
                </select>

                {/* Delete Button */}
                <button
                  onClick={() => onDeleteOrder(order._id)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete item"
                >
                  <FaTrashAlt />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer Summary */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-500">
          Total Items: {orders.length}
        </span>
        <span className="text-sm font-bold text-gray-800">
          Total: ₹{orders.reduce((sum, o) => sum + (o.price * o.quantity), 0)}
        </span>
      </div>
    </div>
  );
};

export default GroupedOrderCard;
