import React from "react";
import { motion } from "framer-motion";
import GroupedOrderCard from "./GroupedOrderCard";

/**
 * Orders Section Component
 * Displays all active orders grouped by user
 */
const OrdersSection = ({
  groupedOrders,
  highlightedOrder,
  onStatusChange,
  onDeleteOrder,
}) => {
  // State to track expanded users
  const [expandedUsers, setExpandedUsers] = React.useState({});

  const toggleUser = (userKey) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userKey]: !prev[userKey]
    }));
  };

  if (Object.keys(groupedOrders).length === 0) {
    return (
      <motion.div
        key="orders"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-lg rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6"
      >
        <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-3 sm:mb-4">
          🧾 Active Orders
        </h3>
        <p className="text-gray-500 text-sm sm:text-base">No active orders.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="orders"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="bg-white shadow-lg rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6"
    >
      <h3 className="text-base sm:text-xl font-bold text-gray-700 mb-2 sm:mb-4 px-1">
        🧾 Active Orders
      </h3>

      {Object.values(groupedOrders).map((userGroup, idx) => {
        // Group orders by date (YYYY-MM-DD)
        const dateGroupedOrders = {};
        let totalItems = 0;
        let totalPrice = 0;
        
        userGroup.items.forEach(order => {
          // Create a date key (YYYY-MM-DD)
          const date = new Date(order.createdAt);
          const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          
          if (!dateGroupedOrders[dateKey]) {
            dateGroupedOrders[dateKey] = [];
          }
          dateGroupedOrders[dateKey].push(order);
          totalItems += 1;
          totalPrice += (order.price * order.quantity);
        });

        // Sort date groups by most recent first
        const sortedDateKeys = Object.keys(dateGroupedOrders).sort((a, b) => {
          const timeA = new Date(dateGroupedOrders[a][0].createdAt).getTime();
          const timeB = new Date(dateGroupedOrders[b][0].createdAt).getTime();
          return timeB - timeA;
        });

        const userKey = userGroup.userEmail || `user-${idx}`;
        const isExpanded = expandedUsers[userKey];

        return (
          <div key={idx} className="mb-1.5 sm:mb-3 border border-gray-100 rounded-lg overflow-hidden last:mb-0">
            {/* Collapsible User Header */}
            <div 
              onClick={() => toggleUser(userKey)}
              className={`
                flex justify-between items-center 
                p-1.5 sm:p-3 
                cursor-pointer 
                transition-colors
                ${isExpanded ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-100'}
              `}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`
                  w-5 h-5 sm:w-8 sm:h-8 
                  rounded-full 
                  flex items-center justify-center 
                  text-[10px] sm:text-sm font-bold 
                  ${isExpanded ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}
                `}>
                  {(userGroup.userName || "G").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] sm:text-base font-bold text-gray-800 truncate leading-tight">
                    {userGroup.userName || userGroup.userEmail || "Guest User"}
                  </h4>
                  <p className="text-[9px] sm:text-xs text-gray-500 truncate leading-tight">
                    {totalItems} items • ₹{totalPrice.toFixed(0)}
                  </p>
                </div>
              </div>
              
              {/* Arrow Icon */}
              <svg 
                className={`w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="bg-white p-1.5 sm:p-3 border-t border-gray-100">
                {sortedDateKeys.map((dateKey) => (
                  <GroupedOrderCard
                    key={dateKey}
                    orders={dateGroupedOrders[dateKey]}
                    onStatusChange={onStatusChange}
                    onDeleteOrder={onDeleteOrder}
                    userName={userGroup.userName}
                    userEmail={userGroup.userEmail}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
};

export default OrdersSection;

