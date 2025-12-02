import React, { useState } from "react";
import { FaChair, FaPhone, FaClock, FaTrashAlt, FaChevronDown, FaUtensils, FaCheckCircle, FaHourglassHalf, FaConciergeBell } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

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

  // State for expand/collapse - collapsed by default
  const [isExpanded, setIsExpanded] = useState(false);

  // Get common details from the first order
  const firstOrder = orders[0];
  const orderDate = new Date(firstOrder.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const orderTime = new Date(firstOrder.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
  });

  const getStatusConfig = (status) => {
    switch(status) {
      case "Order": return { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <FaHourglassHalf /> };
      case "Preparing": return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: <FaUtensils /> };
      case "Served": return { color: "bg-purple-100 text-purple-700 border-purple-200", icon: <FaConciergeBell /> };
      case "Completed": return { color: "bg-green-100 text-green-700 border-green-200", icon: <FaCheckCircle /> };
      default: return { color: "bg-gray-100 text-gray-700 border-gray-200", icon: <FaClock /> };
    }
  };

  // Helper function to get chair letters
  const getChairDisplay = (order) => {
    // Check for multiple tables first
    if (order.tables && order.tables.length > 0) {
      return order.tables.map(t => {
        const letters = t.chairLetters || '';
        // Format: "1 a, b"
        if (letters) return `${t.tableNumber} ${letters}`;
        return `${t.tableNumber}`;
      }).join(' & '); // Join with " & "
    }

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden mb-4"
    >
      {/* 🏷️ Header - Date & Location Info with Expand/Collapse Button */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Time</span>
               <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <FaClock className="text-orange-500" />
                  <span>{orderDate} • {orderTime}</span>
               </div>
            </div>

            {/* Location Badge */}
            {(() => {
              const hasTable = firstOrder.tableNumber && firstOrder.tableNumber > 0;
              const hasContact = firstOrder.contactNumber && firstOrder.contactNumber.trim() !== '';
              const chairDisplay = getChairDisplay(firstOrder);
              
              if (hasTable) {
                return (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg ml-4">
                    <FaChair className="text-red-500" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] text-red-400 font-bold uppercase">Table</span>
                        <span className="text-sm font-bold text-red-700">
                          {firstOrder.tables && firstOrder.tables.length > 0 
                            ? `${chairDisplay}`
                            : `${firstOrder.tableNumber}${chairDisplay ? ` (${chairDisplay})` : ''}`
                          }
                        </span>
                    </div>
                  </div>
                );
              } else if (hasContact) {
                return (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg ml-4">
                    <FaPhone className="text-blue-500" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] text-blue-400 font-bold uppercase">Contact</span>
                        <span className="text-sm font-bold text-blue-700">
                          {firstOrder.contactNumber}
                        </span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="flex items-center gap-4">
            {!isExpanded && (
               <div className="text-right hidden sm:block">
                  <span className="text-xs text-gray-400 block">Total Amount</span>
                  <span className="text-lg font-bold text-gray-800">
                    ₹{orders.reduce((sum, o) => sum + (o.price * o.quantity), 0)}
                  </span>
               </div>
            )}
            <div className={`
              w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300
              ${isExpanded ? "rotate-180 bg-orange-100 text-orange-600" : "text-gray-500"}
            `}>
              <FaChevronDown />
            </div>
          </div>
        </div>
        
        {/* Mobile Location Badge (if hidden above) */}
        <div className="mt-3 sm:hidden flex gap-2">
            {(() => {
              const hasTable = firstOrder.tableNumber && firstOrder.tableNumber > 0;
              const hasContact = firstOrder.contactNumber && firstOrder.contactNumber.trim() !== '';
              const chairDisplay = getChairDisplay(firstOrder);
              
              if (hasTable) {
                return (
                  <div className="flex items-center gap-2 px-2 py-1 bg-red-50 border border-red-100 rounded text-xs">
                    <FaChair className="text-red-500" />
                    <span className="font-bold text-red-700">
                      {firstOrder.tables && firstOrder.tables.length > 0 
                        ? `${chairDisplay}`
                        : `Table ${firstOrder.tableNumber}${chairDisplay ? ` (${chairDisplay})` : ''}`
                      }
                    </span>
                  </div>
                );
              } else if (hasContact) {
                return (
                  <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-xs">
                    <FaPhone className="text-blue-500" />
                    <span className="font-bold text-blue-700">
                      {firstOrder.contactNumber}
                    </span>
                  </div>
                );
              }
              return null;
            })()}
        </div>
      </div>

      {/* 📋 Order Items List - Expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50/50"
          >
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const statusStyle = getStatusConfig(order.status);
                
                return (
                  <div key={order._id} className="p-4 hover:bg-white transition-colors">
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                      {/* Item Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                           <h4 className="font-bold text-gray-800 text-base">
                             {order.foodName}
                           </h4>
                           <span className="font-bold text-gray-900 sm:hidden">
                             ₹{order.price * order.quantity}
                           </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {order.selectedSize && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase tracking-wide">
                              {order.selectedSize}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide font-bold ${
                              order.type === 'Veg' ? 'bg-green-50 text-green-600 border-green-100' : 
                              order.type === 'Non-Veg' ? 'bg-red-50 text-red-600 border-red-100' : 
                              'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {order.type}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">
                             Qty: {order.quantity}
                          </span>
                          <span className="text-gray-400">×</span>
                          <span>₹{order.price}</span>
                        </div>
                      </div>

                      {/* Actions & Status */}
                      <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <div className="flex-1 sm:flex-none">
                            <div className="relative">
                                <select
                                    value={order.status}
                                    onChange={(e) => onStatusChange(order._id, e.target.value)}
                                    className={`appearance-none w-full sm:w-36 pl-8 pr-8 py-2 rounded-lg text-sm font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${statusStyle.color}`}
                                >
                                    <option>Order</option>
                                    <option>Preparing</option>
                                    <option>Served</option>
                                    <option>Completed</option>
                                </select>
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {statusStyle.icon}
                                </div>
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs opacity-60">
                                    ▼
                                </div>
                            </div>
                        </div>

                        <span className="font-bold text-gray-900 hidden sm:block min-w-[60px] text-right">
                             ₹{order.price * order.quantity}
                        </span>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteOrder(order._id)}
                          className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete item"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer Summary */}
            <div className="bg-gray-100/50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Total Items: {orders.length}
              </span>
              <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-500">Total:</span>
                 <span className="text-xl font-bold text-gray-800">
                   ₹{orders.reduce((sum, o) => sum + (o.price * o.quantity), 0)}
                 </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GroupedOrderCard;
