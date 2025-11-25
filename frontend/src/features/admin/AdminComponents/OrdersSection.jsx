import React from "react";
import { motion } from "framer-motion";
import OrderCard from "./OrderCard";

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
          🧾 Orders Grouped by User
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
      className="bg-white shadow-lg rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6"
    >
      <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-3 sm:mb-4">
        🧾 Orders Grouped by User
      </h3>

      {Object.values(groupedOrders).map((userGroup, idx) => (
        <div key={idx} className="mb-6 sm:mb-8 border-b pb-4 sm:pb-5">
          <h4 className="text-base sm:text-lg font-bold text-red-700 mb-1 sm:mb-2">
            👤 {userGroup.userName}
          </h4>
          <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3 break-all">
            📧 {userGroup.userEmail}
          </p>

          {userGroup.items.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              isHighlighted={highlightedOrder === order._id}
              onStatusChange={onStatusChange}
              onDeleteOrder={onDeleteOrder}
              userName={userGroup.userName}
              userEmail={userGroup.userEmail}
            />
          ))}
        </div>
      ))}
    </motion.div>
  );
};

export default OrdersSection;

