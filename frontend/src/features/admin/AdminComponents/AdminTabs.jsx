import React from "react";
import { motion } from "framer-motion";
import { 
  FaClipboardList, 
  FaHistory, 
  FaUtensils, 
  FaPlus, 
  FaChartLine, 
  FaGift,
  FaUserShield 
} from "react-icons/fa";

/**
 * Admin Tabs Navigation Component
 * Displays tab navigation for admin dashboard
 * @param {string} activeTab - Currently active tab
 * @param {function} onTabChange - Callback when tab changes
 * @param {boolean} isSuperAdmin - Whether current user is super admin (shows Admins tab)
 */
const AdminTabs = ({ activeTab, onTabChange, isSuperAdmin = false }) => {
  const baseTabs = [
    { id: "orders", label: "Orders", icon: FaClipboardList, color: "from-blue-500 to-blue-600" },
    { id: "history", label: "History", icon: FaHistory, color: "from-purple-500 to-purple-600" },
    { id: "foods", label: "Food List", icon: FaUtensils, color: "from-orange-500 to-orange-600" },
    { id: "addFood", label: "Add Food", icon: FaPlus, color: "from-green-500 to-green-600" },
    { id: "sales", label: "Total Sales", icon: FaChartLine, color: "from-red-500 to-red-600" },
    { id: "offers", label: "Offers", icon: FaGift, color: "from-pink-500 to-pink-600" },
  ];

  // Only show Admins tab for super admin
  const tabs = isSuperAdmin
    ? [...baseTabs, { id: "admins", label: "Admins", icon: FaUserShield, color: "from-indigo-500 to-indigo-600" }]
    : baseTabs;

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="mb-8 px-2 sm:px-4">
        <div className="bg-white rounded-2xl shadow-lg p-2 sm:p-3 border border-gray-100">
          <div 
            className="hide-scrollbar flex gap-2 overflow-x-auto pb-1"
            style={{
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* IE and Edge */
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative flex items-center gap-2
                    px-3 sm:px-6 py-2.5 sm:py-3
                    rounded-xl font-semibold text-xs sm:text-base
                    transition-all duration-300 whitespace-nowrap
                    ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon className={`text-base sm:text-xl ${isActive ? "" : "text-gray-400"}`} />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminTabs;
