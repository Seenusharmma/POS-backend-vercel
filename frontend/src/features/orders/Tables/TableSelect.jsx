import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaChair, FaCheckCircle } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import API_BASE from "../../../config/api";

const TableSelect = ({ tableNumber, setTableNumber, availableTables, onChairsSelected }) => {
  const [tables, setTables] = useState([]);
  const [selectedChairs, setSelectedChairs] = useState({}); // { tableNumber: [chairNumbers] }
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Fetch table availability from orders
  useEffect(() => {
    const fetchTableAvailability = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/orders`);
        const activeOrders = res.data.filter(
          (o) => o.status !== "Completed" && o.status !== "Served"
        );

        // Group by table and calculate booked chairs
        // Count chairs booked per table from active orders
        const tableBookings = {};
        activeOrders.forEach((order) => {
          const tableNum = order.tableNumber;
          if (!tableBookings[tableNum]) {
            tableBookings[tableNum] = {
              totalChairsBooked: 0,
              users: new Set(),
            };
          }
          // Track unique users and total chairs
          const userKey = order.userEmail || order.userId || "unknown";
          tableBookings[tableNum].users.add(userKey);
          // Each order represents at least 1 chair (default)
          tableBookings[tableNum].totalChairsBooked += order.chairsBooked || 1;
        });

        // Convert to chair indices (simple approach: first N chairs are booked)
        Object.keys(tableBookings).forEach((tableNum) => {
          const booking = tableBookings[tableNum];
          const bookedCount = Math.min(booking.totalChairsBooked || booking.users.size || 0, 4);
          booking.chairIndices = Array.from({ length: bookedCount }, (_, i) => i);
        });

        // Create table data with 4 chairs each
        const tablesData = Array.from({ length: 40 }, (_, i) => {
          const tableNum = i + 1;
          const booking = tableBookings[tableNum];
          const bookedIndices = booking?.chairIndices || [];
          return {
            tableNumber: tableNum,
            totalChairs: 4,
            bookedChairs: bookedIndices.length,
            availableChairs: 4 - bookedIndices.length,
            bookedChairIndices: bookedIndices,
          };
        });

        setTables(tablesData);
      } catch (error) {
        console.error("Error fetching table availability:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTableAvailability();
    const interval = setInterval(fetchTableAvailability, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleChairClick = (tableNum, chairIndex) => {
    const table = tables.find((t) => t.tableNumber === tableNum);
    if (!table) return;

    // Check if chair is already booked
    if (table.bookedChairIndices.includes(chairIndex)) {
      return; // Can't select booked chair
    }

    // Toggle chair selection - allow multiple chairs at same table
    setSelectedChairs((prev) => {
      const tableChairs = prev[tableNum] || [];
      const isSelected = tableChairs.includes(chairIndex);

      if (isSelected) {
        // Deselect chair
        const updated = { ...prev };
        updated[tableNum] = tableChairs.filter((c) => c !== chairIndex);
        if (updated[tableNum].length === 0) {
          delete updated[tableNum];
          setTableNumber("");
        } else {
          setTableNumber(tableNum.toString());
        }
        return updated;
      } else {
        // Select chair - can select multiple chairs at same table
        // If selecting from different table, clear previous selection
        if (tableNumber && tableNumber !== tableNum.toString()) {
          const updated = { [tableNum]: [chairIndex] };
          setTableNumber(tableNum.toString());
          return updated;
        } else {
          // Add to current table (can select multiple)
          const updated = { ...prev };
          updated[tableNum] = [...tableChairs, chairIndex].sort((a, b) => a - b);
          setTableNumber(tableNum.toString());
          return updated;
        }
      }
    });
  };

  const clearSelection = () => {
    setSelectedChairs({});
    setTableNumber("");
  };

  const getChairState = (tableNum, chairIndex) => {
    const table = tables.find((t) => t.tableNumber === tableNum);
    if (!table) return "available";

    // Check if booked
    if (table.bookedChairIndices.includes(chairIndex)) {
      return "booked";
    }

    // Check if selected
    const selected = selectedChairs[tableNum] || [];
    if (selected.includes(chairIndex)) {
      return "selected";
    }

    return "available";
  };

  const getSelectedChairsCount = () => {
    if (!tableNumber) return 0;
    return selectedChairs[Number(tableNumber)]?.length || 0;
  };

  // Notify parent component of selected chairs count
  useEffect(() => {
    const count = getSelectedChairsCount();
    if (onChairsSelected) {
      onChairsSelected(count || 1); // Default to 1 if no chairs selected
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChairs, tableNumber]);

  if (loading) {
  return (
    <div className="mb-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <div className="w-full sm:flex-1">
          <label className="block font-bold text-gray-800 text-xl sm:text-2xl mb-2">
            🎫 Select Your Table & Seats
      </label>
          <p className="text-sm sm:text-base text-gray-600">
            Click on available green chairs to select. You can choose multiple seats at the same table.
          </p>
        </div>
        {tableNumber && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl px-4 py-3 w-full sm:w-auto shadow-md"
          >
            <FaCheckCircle className="text-red-600 flex-shrink-0 text-lg" />
            <div className="text-sm sm:text-base font-bold text-red-700 flex-1">
              Table {tableNumber} • {getSelectedChairsCount()} seat{getSelectedChairsCount() !== 1 ? "s" : ""}
            </div>
            <button
              onClick={clearSelection}
              className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-1.5 transition-colors flex-shrink-0"
              title="Clear selection"
            >
              <IoClose className="text-xl" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Legend - Collapsible */}
      <motion.div
        initial={false}
        className="mb-5 sm:mb-6 bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-200 shadow-sm w-full"
      >
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center justify-between w-full text-left group"
        >
          <span className="font-bold text-gray-800 text-sm sm:text-base">📋 Legend</span>
          <span className="text-gray-500 text-xl sm:text-2xl transition-transform group-hover:scale-110">
            {showLegend ? "−" : "+"}
          </span>
        </button>
        <AnimatePresence>
          {showLegend && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-500 border-2 border-green-600 shadow-md flex items-center justify-center flex-shrink-0">
                    <FaChair className="text-white text-sm" />
                  </div>
                  <span className="text-gray-700 font-semibold text-sm sm:text-base">Available</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500 border-2 border-red-600 shadow-lg flex items-center justify-center flex-shrink-0">
                    <FaCheckCircle className="text-white text-sm" />
                  </div>
                  <span className="text-gray-700 font-semibold text-sm sm:text-base">Selected</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-400 border-2 border-gray-500 opacity-70 flex items-center justify-center flex-shrink-0">
                    <FaChair className="text-white text-sm" />
                  </div>
                  <span className="text-gray-700 font-semibold text-sm sm:text-base">Booked</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tables Grid - Movie Theater Style */}
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 border-2 border-gray-200 shadow-inner max-h-[400px] sm:max-h-[500px] md:max-h-[600px] lg:max-h-[750px] xl:max-h-[800px] overflow-y-auto custom-scrollbar w-full">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
          {tables.map((table, index) => {
            const isTableSelected = tableNumber === table.tableNumber.toString();
            const selectedCount = selectedChairs[table.tableNumber]?.length || 0;

            return (
              <motion.div
                key={table.tableNumber}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01, duration: 0.2 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className={`relative bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-2 transition-all duration-300 cursor-pointer w-full ${
                  isTableSelected
                    ? "border-red-500 shadow-2xl ring-2 lg:ring-4 ring-red-200 scale-105"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-xl"
                }`}
              >
                {/* Table Number Badge */}
                <div className="text-center mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                  <span
                    className={`inline-block px-1.5 sm:px-2 md:px-3 lg:px-4 py-0.5 sm:py-1 md:py-1.5 lg:py-2 rounded-md sm:rounded-lg lg:rounded-xl text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-bold ${
                      isTableSelected
                        ? "bg-red-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Table {table.tableNumber}
                  </span>
                </div>

                {/* Chairs arranged around table (like cinema seats) */}
                <div className="space-y-1 sm:space-y-1.5 md:space-y-2 lg:space-y-2.5 xl:space-y-3">
                  {/* Top row - 2 chairs */}
                  <div className="flex justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3">
                    {[0, 1].map((chairIndex) => {
                      const state = getChairState(table.tableNumber, chairIndex);
                      return (
                        <motion.button
                          key={chairIndex}
                          type="button"
                          whileHover={{ scale: 1.15, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleChairClick(table.tableNumber, chairIndex)
                          }
                          disabled={state === "booked"}
                          className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                            state === "selected"
                              ? "bg-gradient-to-br from-red-500 to-red-600 text-white border-2 border-red-700 shadow-xl ring-1 sm:ring-2 lg:ring-2 ring-red-300"
                              : state === "booked"
                              ? "bg-gray-400 text-white border-2 border-gray-500 cursor-not-allowed opacity-60"
                              : "bg-gradient-to-br from-green-500 to-green-600 text-white border-2 border-green-700 hover:from-green-600 hover:to-green-700 cursor-pointer shadow-lg hover:shadow-xl"
                          }`}
                          title={
                            state === "booked"
                              ? "Already booked"
                              : state === "selected"
                              ? "Click to deselect"
                              : "Click to select"
                          }
                        >
                          {state === "selected" ? (
                            <FaCheckCircle className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg" />
                          ) : (
                            <FaChair className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Table representation - cleaner design */}
                  <div
                    className={`h-4 sm:h-5 md:h-6 lg:h-8 xl:h-10 rounded-md sm:rounded-lg lg:rounded-xl mx-1 sm:mx-1.5 md:mx-2 lg:mx-2.5 xl:mx-3 my-1 sm:my-1.5 md:my-2 lg:my-2.5 xl:my-3 flex items-center justify-center transition-all ${
                      isTableSelected
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg"
                        : "bg-gradient-to-r from-yellow-200 to-yellow-300"
                    }`}
                  >
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-bold text-yellow-900">
                      {table.tableNumber}
                    </span>
                  </div>

                  {/* Bottom row - 2 chairs */}
                  <div className="flex justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3">
                    {[2, 3].map((chairIndex) => {
                      const state = getChairState(table.tableNumber, chairIndex);
                      return (
                        <motion.button
                          key={chairIndex}
                          type="button"
                          whileHover={{ scale: 1.15, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleChairClick(table.tableNumber, chairIndex)
                          }
                          disabled={state === "booked"}
                          className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                            state === "selected"
                              ? "bg-gradient-to-br from-red-500 to-red-600 text-white border-2 border-red-700 shadow-xl ring-1 sm:ring-2 lg:ring-2 ring-red-300"
                              : state === "booked"
                              ? "bg-gray-400 text-white border-2 border-gray-500 cursor-not-allowed opacity-60"
                              : "bg-gradient-to-br from-green-500 to-green-600 text-white border-2 border-green-700 hover:from-green-600 hover:to-green-700 cursor-pointer shadow-lg hover:shadow-xl"
                          }`}
                          title={
                            state === "booked"
                              ? "Already booked"
                              : state === "selected"
                              ? "Click to deselect"
                              : "Click to select"
                          }
                        >
                          {state === "selected" ? (
                            <FaCheckCircle className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg" />
                          ) : (
                            <FaChair className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Availability info - cleaner design */}
                <div className="text-center mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 pt-1.5 sm:pt-2 md:pt-3 lg:pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                    <span
                      className={`text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-bold ${
                        table.availableChairs > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {table.availableChairs}
                    </span>
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-400">/</span>
                    <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base text-gray-600 font-medium">4</span>
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-500 ml-0.5 sm:ml-1">available</span>
                  </div>
                  {selectedCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base text-red-600 font-bold mt-0.5 sm:mt-1"
                    >
                      ✓ {selectedCount} selected
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Summary */}
      <AnimatePresence>
        {tableNumber && getSelectedChairsCount() > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl shadow-lg w-full"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCheckCircle className="text-white text-sm sm:text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-red-700 truncate">
                    Table {tableNumber} Selected
                  </p>
                  <p className="text-[10px] sm:text-xs text-red-600">
                    {getSelectedChairsCount()} seat{getSelectedChairsCount() > 1 ? "s" : ""} chosen
                  </p>
                </div>
              </div>
              <button
                onClick={clearSelection}
                className="p-1.5 sm:p-2 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                title="Clear selection"
              >
                <IoClose className="text-red-600 text-lg sm:text-xl" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!tableNumber && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-center w-full"
        >
          <p className="text-xs sm:text-sm font-medium text-blue-700">
            💡 Click on available green chairs to select your table and seats
          </p>
          <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
            You can select multiple seats at the same table
          </p>
        </motion.div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default TableSelect;
