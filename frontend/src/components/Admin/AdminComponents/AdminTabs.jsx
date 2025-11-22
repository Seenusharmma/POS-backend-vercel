import React from "react";
import { motion } from "framer-motion";

/**
 * Admin Tabs Navigation Component
 * Displays tab navigation for admin dashboard
 */
const AdminTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "orders", label: "🧾 Orders", shortLabel: "🧾" },
    { id: "history", label: "📜 History", shortLabel: "📜" },
    { id: "foods", label: "🍽️ Food List", shortLabel: "🍽️" },
    { id: "addFood", label: "➕ Add Food", shortLabel: "➕" },
    { id: "sales", label: "💰 Total Sales", shortLabel: "💰" },
  ];

  return (
    <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 border-b border-gray-200 overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 sm:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "text-red-600"
                : "text-gray-500 hover:text-red-400"
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-600 rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminTabs;

