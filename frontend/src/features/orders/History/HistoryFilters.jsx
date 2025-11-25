import React from "react";
import { motion } from "framer-motion";
import { IoSearch } from "react-icons/io5";
import { FaFilter } from "react-icons/fa";
import DateRangePicker from "./DateRangePicker";

const HistoryFilters = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  paymentStatus,
  onPaymentStatusChange,
  orderType,
  onOrderTypeChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-4 sm:p-5 mb-6 border border-gray-100"
    >
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by order ID or food name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-500 text-sm" />
          <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
        </div>

        {/* Payment Status Filter */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => onPaymentStatusChange("all")}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              paymentStatus === "all"
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onPaymentStatusChange("paid")}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              paymentStatus === "paid"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => onPaymentStatusChange("pending")}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              paymentStatus === "pending"
                ? "bg-yellow-600 text-white"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
        </div>

        {/* Order Type Filter */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => onOrderTypeChange("all")}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              orderType === "all"
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onOrderTypeChange("dinein")}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              orderType === "dinein"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Dine-in
          </button>
          <button
            onClick={() => onOrderTypeChange("delivery")}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              orderType === "delivery"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Delivery
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default HistoryFilters;

