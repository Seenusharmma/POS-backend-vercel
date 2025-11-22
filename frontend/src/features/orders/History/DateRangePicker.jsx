import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";

const DateRangePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "thisWeek" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last 3 Months", value: "last3Months" },
    { label: "All Time", value: "allTime" },
  ];

  const getDateRange = (preset) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "thisWeek":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { start: weekStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "thisMonth":
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "last3Months":
        return { start: new Date(now.getFullYear(), now.getMonth() - 3, 1), end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "allTime":
        return { start: null, end: null };
      default:
        return value;
    }
  };

  const handlePresetClick = (preset) => {
    const range = getDateRange(preset);
    onChange(range);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!value || (!value.start && !value.end)) return "All Time";
    if (!value.start || !value.end) return "Custom Range";
    
    const startStr = value.start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const endStr = value.end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
      >
        <FaCalendarAlt className="text-gray-500" />
        <span>{formatDateRange()}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20 min-w-[200px]"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Date Range</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
              <div className="space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetClick(preset.value)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;

