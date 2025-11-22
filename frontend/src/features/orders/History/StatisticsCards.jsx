import React from "react";
import { motion } from "framer-motion";
import { FaShoppingBag, FaRupeeSign, FaChartLine, FaCalendarAlt } from "react-icons/fa";

const StatisticsCards = ({ orders }) => {
  // Calculate statistics
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + (order.price || 0), 0) * 1.05;
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Calculate this month's stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthOrders = orders.filter(
    (order) => new Date(order.createdAt) >= startOfMonth
  );
  const thisMonthSpent = thisMonthOrders.reduce((sum, order) => sum + (order.price || 0), 0) * 1.05;

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: FaShoppingBag,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
    },
    {
      label: "Total Spent",
      value: `₹${totalSpent.toFixed(2)}`,
      icon: FaRupeeSign,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
    },
    {
      label: "Average Order",
      value: `₹${averageOrderValue.toFixed(2)}`,
      icon: FaChartLine,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
    },
    {
      label: "This Month",
      value: `₹${thisMonthSpent.toFixed(2)}`,
      subValue: `${thisMonthOrders.length} orders`,
      icon: FaCalendarAlt,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.bgGradient} rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all border border-white/50`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${stat.gradient} text-white`}>
                <Icon className="text-sm sm:text-base" />
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                {stat.value}
              </p>
              {stat.subValue && (
                <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatisticsCards;

