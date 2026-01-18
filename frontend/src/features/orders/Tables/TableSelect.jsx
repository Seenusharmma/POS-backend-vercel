import React, { useState, useEffect, useMemo } from "react";

import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaChair, FaCheckCircle } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import API_BASE from "../../../config/api";

/**
 * TABLE OPTIONS CONFIGURATION:
 * - Total Tables: 11 tables (numbered 1-11)
 * - Chairs per Table: 4 chairs per table
 * - Table Numbering: Tables are numbered from 1 to 11
 * - Chair Indices: Each table has 4 chairs indexed 0-3 (top row: 0,1 | bottom row: 2,3)
 * - Delivery Orders: Use tableNumber = 0 for delivery/takeaway orders (not dine-in)
 * - Table Selection: Users can select multiple chairs at the same table
 * - Availability: Tables are considered booked if they have active orders (status !== "Completed" && status !== "Served")
 */
const TableSelect = ({ 
  selectedTables = [], 
  onSelectionChange, 
  availableTables, 
  occupiedTables = {}, // { tableId: [chairIndices] }
  compact = false 
}) => {
  const [tables, setTables] = useState([]);
  // Derive selectedChairs from selectedTables prop
  const selectedChairs = useMemo(() => {
    const initial = {};
    if (Array.isArray(selectedTables)) {
      selectedTables.forEach(t => {
        if (t.tableNumber) {
          initial[t.tableNumber] = t.chairIndices || [];
        }
      });
    }
    return initial;
  }, [selectedTables]);


  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // TABLE OPTIONS: Fetch table availability from orders (40 tables, 4 chairs each)
  useEffect(() => {
    const fetchTableAvailability = async () => {
      try {
        // If availableTables is passed, use it to build structure
        if (availableTables && availableTables.length > 0) {
             setTables(availableTables);
             setLoading(false);
             return;
        }

        const res = await axios.get(`${API_BASE}/api/orders`);
        // TABLE OPTIONS: Filter active orders (tables 1-11, delivery uses 0)
        const activeOrders = res.data.filter(
          (o) => o.status !== "Completed" && o.status !== "Served"
        );

        // TABLE OPTIONS: Group by table and calculate booked chairs (tables 1-11, chairs 0-3)
        // Count chairs booked per table from active orders
        const tableBookings = {};
        activeOrders.forEach((order) => {
          // TABLE OPTIONS: Process table number (1-11 for dine-in, 0 for delivery)
          const tableNum = order.tableNumber;
          if (!tableBookings[tableNum]) {
            tableBookings[tableNum] = {
              totalChairsBooked: 0,
              users: new Set(),
            };
          }
          // TABLE OPTIONS: Track unique users and total chairs (max 4 chairs per table)
          const userKey = order.userEmail || order.userId || "unknown";
          tableBookings[tableNum].users.add(userKey);
          // TABLE OPTIONS: Each order represents at least 1 chair (default, max 4 per table)
          tableBookings[tableNum].totalChairsBooked += order.chairsBooked || 1;
        });

        // TABLE OPTIONS: Convert to chair indices (simple approach: first N chairs are booked)
        // Tables 1-40, chairs indexed 0-3 (max 4 chairs per table)
        Object.keys(tableBookings).forEach((tableNum) => {
          const booking = tableBookings[tableNum];
          // TABLE OPTIONS: Maximum 4 chairs per table (chairs are indexed 0-3)
          const bookedCount = Math.min(booking.totalChairsBooked || booking.users.size || 0, 4);
          booking.chairIndices = Array.from({ length: bookedCount }, (_, i) => i);
        });

        // TABLE OPTIONS: Create table data with 4 chairs each
        // Total of 11 tables (numbered 1-11), each with 4 chairs (indices 0-3)
        const tablesData = Array.from({ length: 11 }, (_, i) => {
          const tableNum = i + 1;
          const booking = tableBookings[tableNum];
          const bookedIndices = booking?.chairIndices || [];
          return {
            tableNumber: tableNum,
            totalChairs: 4, // TABLE OPTIONS: Each table has exactly 4 chairs
            bookedChairs: bookedIndices.length,
            availableChairs: 4 - bookedIndices.length, // TABLE OPTIONS: Available chairs = 4 - booked chairs
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
  }, []); // Only fetch on mount, availableTables will be handled separately if needed


  // TABLE OPTIONS: Handle chair selection (chairs 0-3 per table, tables 1-40)
  const handleChairClick = (tableNum, chairIndex) => {
    const table = tables.find((t) => t.tableNumber === tableNum);
    if (!table) return;

    // Check if chair is occupied (booked by someone else)
    const isOccupied = occupiedTables[tableNum] && occupiedTables[tableNum].includes(chairIndex);
    if (isOccupied) return;

    // TABLE OPTIONS: Check if chair is already booked (legacy check)
    if (table.bookedChairIndices && table.bookedChairIndices.includes(chairIndex)) {
      return; // Can't select booked chair
    }

    // TABLE OPTIONS: Calculate new chair selection
    const tableChairs = selectedChairs[tableNum] || [];
    const isSelected = tableChairs.includes(chairIndex);
    let updatedSelection = { ...selectedChairs };

    if (isSelected) {
      // Deselect chair
      updatedSelection[tableNum] = tableChairs.filter((c) => c !== chairIndex);
      if (updatedSelection[tableNum].length === 0) {
        delete updatedSelection[tableNum];
      }
    } else {
      // Select chair
      updatedSelection[tableNum] = [...tableChairs, chairIndex].sort((a, b) => a - b);
    }

    // Convert back to tablesList format for parent
    const tablesList = Object.keys(updatedSelection).map(tNumStr => {
      const tNum = Number(tNumStr);
      const indices = updatedSelection[tNum];
      return {
        tableNumber: tNum,
        chairIndices: indices,
        chairLetters: getChairLetters(indices),
        chairsBooked: indices.length
      };
    });

    if (onSelectionChange) {
      onSelectionChange(tablesList);
    }
  };

  const clearSelection = () => {
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };


  // TABLE OPTIONS: Get chair state (available/selected/booked) for chairs 0-3 at tables 1-11
  const getChairState = (tableNum, chairIndex) => {
    const table = tables.find((t) => t.tableNumber === tableNum);
    if (!table) return "available";

    // Check if chair is occupied (from prop)
    if (occupiedTables[tableNum] && occupiedTables[tableNum].includes(chairIndex)) {
        return "booked";
    }

    // TABLE OPTIONS: Check if chair is booked (legacy check)
    if (table.bookedChairIndices && table.bookedChairIndices.includes(chairIndex)) {
      return "booked";
    }

    // TABLE OPTIONS: Check if chair is selected by user
    const selected = selectedChairs[tableNum] || [];
    if (selected.includes(chairIndex)) {
      return "selected";
    }

    return "available";
  };

  // TABLE OPTIONS: Get count of selected chairs (1-4) for the current table (1-11)
  const getSelectedChairsCount = (tableNum) => {
    if (!tableNum) {
        // Total selected chairs across all tables
        return Object.values(selectedChairs).reduce((acc, chairs) => acc + chairs.length, 0);
    }
    return selectedChairs[Number(tableNum)]?.length || 0;
  };

  // Convert chair indices to letters: 0=a, 1=b, 2=c, 3=d
  const getChairLetters = (indices) => {
    return indices.map(idx => String.fromCharCode(97 + idx)).join(' '); // 97 is 'a' in ASCII
  };




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
    <div className={`${compact ? 'mb-0' : 'mb-6'} w-full`}>
      {/* Header */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
          <div className="w-full sm:flex-1">
            <label className="block font-bold text-gray-800 text-xl sm:text-2xl mb-2">
              🎫 Select Your Table & Seats
            </label>
            <p className="text-sm sm:text-base text-gray-600">
              Click on available green chairs to select. You can choose multiple seats at the same table.
            </p>
          </div>
        {Object.keys(selectedChairs).length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl px-4 py-3 w-full sm:w-auto shadow-md"
          >
            <FaCheckCircle className="text-red-600 flex-shrink-0 text-lg" />
            <div className="text-sm sm:text-base font-bold text-red-700 flex-1">
              {Object.keys(selectedChairs).map(tNum => (
                  <span key={tNum} className="mr-2">
                      Table {tNum} ({getChairLetters(selectedChairs[tNum])})
                  </span>
              ))}
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
      )}

      {/* Legend - Collapsible */}
      <motion.div
        initial={false}
        className={`${compact ? 'mb-2 p-1.5 sm:p-2' : 'mb-5 sm:mb-6 p-4 sm:p-5'} bg-white ${compact ? 'rounded-lg' : 'rounded-xl'} border-2 border-gray-200 shadow-sm w-full`}
      >
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center justify-between w-full text-left group"
        >
          <span className={`font-bold text-gray-800 ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>📋 Legend</span>
          <span className={`text-gray-500 ${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} transition-transform group-hover:scale-110`}>
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
              <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5 sm:gap-2 mt-1.5 pt-1.5' : 'gap-4 sm:gap-6 mt-4 pt-4'} border-t border-gray-200`}>
                <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2 sm:gap-3'}`}>
                  <div className={`${compact ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-7 h-7 sm:w-8 sm:h-8'} ${compact ? 'rounded-md' : 'rounded-lg'} bg-green-500 border-2 border-green-600 shadow-md flex items-center justify-center flex-shrink-0`}>
                    <FaChair className={`text-white ${compact ? 'text-[8px]' : 'text-sm'}`} />
                  </div>
                  <span className={`text-gray-700 font-semibold ${compact ? 'text-[10px]' : 'text-sm sm:text-base'}`}>Available</span>
                </div>
                <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2 sm:gap-3'}`}>
                  <div className={`${compact ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-7 h-7 sm:w-8 sm:h-8'} ${compact ? 'rounded-md' : 'rounded-lg'} bg-red-500 border-2 border-red-600 shadow-lg flex items-center justify-center flex-shrink-0`}>
                    <FaCheckCircle className={`text-white ${compact ? 'text-[8px]' : 'text-sm'}`} />
                  </div>
                  <span className={`text-gray-700 font-semibold ${compact ? 'text-[10px]' : 'text-sm sm:text-base'}`}>Selected</span>
                </div>
                <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2 sm:gap-3'}`}>
                  <div className={`${compact ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-7 h-7 sm:w-8 sm:h-8'} ${compact ? 'rounded-md' : 'rounded-lg'} bg-gray-400 border-2 border-gray-500 opacity-70 flex items-center justify-center flex-shrink-0`}>
                    <FaChair className={`text-white ${compact ? 'text-[8px]' : 'text-sm'}`} />
                  </div>
                  <span className={`text-gray-700 font-semibold ${compact ? 'text-[10px]' : 'text-sm sm:text-base'}`}>Booked</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tables Grid - Movie Theater Style */}
      <div className={`bg-gradient-to-br from-gray-50 via-white to-gray-50 ${compact ? 'rounded-lg p-1 sm:p-1.5' : 'rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8'} border-2 border-gray-200 shadow-inner ${compact ? 'max-h-[500px] sm:max-h-[600px]' : 'max-h-[400px] sm:max-h-[500px] md:max-h-[600px] lg:max-h-[750px] xl:max-h-[800px]'} overflow-y-auto custom-scrollbar w-full`}>
        <div className={`grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 ${compact ? 'gap-1 sm:gap-1.5' : 'gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6'}`}>
          {tables.map((table, index) => {
            const isTableSelected = !!selectedChairs[table.tableNumber];
            const selectedCount = selectedChairs[table.tableNumber]?.length || 0;

            return (
              <motion.div
                key={table.tableNumber}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01, duration: 0.2 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className={`relative bg-white ${compact ? 'rounded-md p-1 sm:p-1.5' : 'rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6'} border-2 transition-all duration-300 cursor-pointer w-full ${
                  isTableSelected
                    ? "border-red-500 shadow-2xl ring-2 lg:ring-4 ring-red-200 scale-105"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-xl"
                }`}
              >
                {/* Table Number Badge */}
                <div className={`text-center ${compact ? 'mb-0.5 sm:mb-1' : 'mb-1.5 sm:mb-2 md:mb-3 lg:mb-4'}`}>
                  <span
                    className={`inline-block ${compact ? 'px-1 py-0.5 rounded text-[9px] sm:text-[10px]' : 'px-1.5 sm:px-2 md:px-3 lg:px-4 py-0.5 sm:py-1 md:py-1.5 lg:py-2 rounded-md sm:rounded-lg lg:rounded-xl text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg'} font-bold ${
                      isTableSelected
                        ? "bg-red-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {compact ? table.tableNumber : `Table ${table.tableNumber}`}
                  </span>
                </div>

                {/* Chairs arranged around table (like cinema seats) */}
                <div className={`${compact ? 'space-y-0.5 sm:space-y-1' : 'space-y-1 sm:space-y-1.5 md:space-y-2 lg:space-y-2.5 xl:space-y-3'}`}>
                  {/* TABLE OPTIONS: Top row - 2 chairs (indices 0 and 1) */}
                  <div className={`flex justify-center ${compact ? 'gap-0.5 sm:gap-1' : 'gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3'}`}>
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
                    className={`${compact ? 'h-2 sm:h-2.5' : 'h-4 sm:h-5 md:h-6 lg:h-8 xl:h-10'} ${compact ? 'rounded mx-0.5 sm:mx-1 my-0.5 sm:my-1' : 'rounded-md sm:rounded-lg lg:rounded-xl mx-1 sm:mx-1.5 md:mx-2 lg:mx-2.5 xl:mx-3 my-1 sm:my-1.5 md:my-2 lg:my-2.5 xl:my-3'} flex items-center justify-center transition-all ${
                      isTableSelected
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg"
                        : "bg-gradient-to-r from-yellow-200 to-yellow-300"
                    }`}
                  >
                    {!compact && (
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-bold text-yellow-900">
                        {table.tableNumber}
                      </span>
                    )}
                  </div>

                  {/* TABLE OPTIONS: Bottom row - 2 chairs (indices 2 and 3) */}
                  <div className={`flex justify-center ${compact ? 'gap-0.5 sm:gap-1' : 'gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3'}`}>
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
                <div className={`text-center ${compact ? 'mt-0.5 sm:mt-1 pt-0.5 sm:pt-1' : 'mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 pt-1.5 sm:pt-2 md:pt-3 lg:pt-4'} border-t border-gray-200`}>
                  <div className={`flex items-center justify-center ${compact ? 'gap-0.5' : 'gap-0.5 sm:gap-1'}`}>
                    <span
                      className={`${compact ? 'text-[8px]' : 'text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base'} font-bold ${
                        table.availableChairs > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {table.availableChairs}
                    </span>
                    <span className={`${compact ? 'text-[8px]' : 'text-[9px] sm:text-[10px] md:text-xs'} text-gray-400`}>/</span>
                    <span className={`${compact ? 'text-[8px]' : 'text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base'} text-gray-600 font-medium`}>4</span>
                    {/* TABLE OPTIONS: Total chairs per table = 4 */}
                    {!compact && (
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-500 ml-0.5 sm:ml-1">available</span>
                    )}
                  </div>
                  {selectedCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`${compact ? 'text-[8px]' : 'text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base'} text-red-600 font-bold ${compact ? 'mt-0.5' : 'mt-0.5 sm:mt-1'}`}
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
        {Object.keys(selectedChairs).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`${compact ? 'mt-2 p-2 sm:p-2.5' : 'mt-4 p-3 sm:p-4'} bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 ${compact ? 'rounded-lg' : 'rounded-xl'} shadow-lg w-full`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2 sm:gap-3'} flex-1 min-w-0`}>
                <div className={`${compact ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-red-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <FaCheckCircle className={`text-white ${compact ? 'text-xs' : 'text-sm sm:text-lg'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`${compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} font-bold text-red-700 truncate`}>
                    {Object.keys(selectedChairs).length} Table{Object.keys(selectedChairs).length > 1 ? 's' : ''} Selected
                  </p>
                  <p className={`${compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'} text-red-600`}>
                    {getSelectedChairsCount()} seat{getSelectedChairsCount() > 1 ? "s" : ""} chosen total
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

      {Object.keys(selectedChairs).length === 0 && !compact && (
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
