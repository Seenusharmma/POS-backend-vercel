import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import GroupedOrderCard from "./GroupedOrderCard";
import { FaClipboardList, FaChevronDown} from "react-icons/fa";

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
        key="orders-empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-lg rounded-2xl p-6 sm:p-10 text-center border border-gray-100"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <FaClipboardList className="text-3xl sm:text-4xl text-orange-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          No Active Orders
        </h3>
        <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
          New orders will appear here automatically. Sit back and relax!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="orders-list"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 sm:gap-3 px-0.5">
        <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
           <FaClipboardList className="text-orange-600 text-base sm:text-xl" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
          Active Orders
        </h3>
        <span className="bg-orange-100 text-orange-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold">
          {Object.keys(groupedOrders).length}
        </span>
      </div>

      <div className="grid gap-3 sm:gap-4">
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
            <motion.div 
              key={userKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`
                bg-white rounded-xl overflow-hidden border transition-all duration-300
                ${isExpanded ? 'shadow-lg border-orange-200 ring-1 ring-orange-100' : 'shadow-sm border-gray-200 hover:shadow-md'}
              `}
            >
              {/* Collapsible User Header */}
              <div 
                onClick={() => toggleUser(userKey)}
                className={`
                  flex justify-between items-center 
                  p-3 sm:p-4
                  cursor-pointer 
                  transition-colors
                  ${isExpanded ? 'bg-orange-50/50' : 'bg-white hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`
                    w-10 h-10 sm:w-12 sm:h-12
                    rounded-full flex-shrink-0
                    flex items-center justify-center 
                    text-base sm:text-lg font-bold shadow-sm
                    transition-colors duration-300
                    ${isExpanded ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}
                  `}>
                    {(userGroup.userName || "G").charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-sm sm:text-base font-bold transition-colors truncate ${isExpanded ? 'text-orange-900' : 'text-gray-800'}`}>
                      {userGroup.userName || userGroup.userEmail || "Guest User"}
                    </h4>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-300"></span>
                        {totalItems} items
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-300"></span>
                        ₹{totalPrice.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`
                  w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
                  ${isExpanded ? 'bg-orange-200 text-orange-700 rotate-180' : 'bg-gray-100 text-gray-400'}
                `}>
                  <FaChevronDown className="text-xs sm:text-sm" />
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-orange-100 bg-white"
                  >
                    <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default OrdersSection;
