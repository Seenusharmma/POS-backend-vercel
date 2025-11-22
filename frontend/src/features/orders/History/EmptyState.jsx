import React from "react";
import { motion } from "framer-motion";
import { FaShoppingBag, FaSearch, FaInbox } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const EmptyState = ({ type = "noOrders", onRefresh }) => {
  const navigate = useNavigate();

  const states = {
    noOrders: {
      icon: FaShoppingBag,
      title: "No Orders Yet",
      message: "You haven't placed any orders yet. Start ordering delicious food!",
      primaryAction: {
        label: "Browse Menu",
        onClick: () => navigate("/menu"),
      },
      secondaryAction: {
        label: "Go to Home",
        onClick: () => navigate("/"),
      },
    },
    noResults: {
      icon: FaSearch,
      title: "No Orders Found",
      message: "No orders match your current filters. Try adjusting your search criteria.",
      primaryAction: {
        label: "Clear Filters",
        onClick: onRefresh,
      },
    },
    loading: {
      icon: FaInbox,
      title: "Loading...",
      message: "Fetching your order history...",
    },
  };

  const state = states[type];
  const Icon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-4"
    >
      <div className="mb-6">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center mb-4">
          <Icon className="text-4xl sm:text-5xl text-orange-500" />
        </div>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 text-center">
        {state.title}
      </h3>
      <p className="text-gray-600 text-sm sm:text-base text-center max-w-md mb-6">
        {state.message}
      </p>
      {state.primaryAction && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={state.primaryAction.onClick}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-md"
          >
            {state.primaryAction.label}
          </button>
          {state.secondaryAction && (
            <button
              onClick={state.secondaryAction.onClick}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              {state.secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;

