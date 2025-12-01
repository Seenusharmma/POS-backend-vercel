import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import TableSelect from "./TableSelect";
import axios from "axios";
import API_BASE from "../../../config/api";

/**
 * TABLE OPTIONS CONFIGURATION:
 * - Total Tables: 40 tables (numbered 1-40)
 * - Chairs per Table: 4 chairs per table
 * - Table Numbering: Tables are numbered from 1 to 40
 * - Chair Indices: Each table has 4 chairs indexed 0-3 (top row: 0,1 | bottom row: 2,3)
 * - Delivery Orders: Use tableNumber = 0 for delivery/takeaway orders (not dine-in)
 * - Table Selection: Users can select multiple chairs at the same table
 * - Availability: Tables are considered booked if they have active orders (status !== "Completed" && status !== "Served")
 */
const TableSelectionModal = ({
  isOpen,
  onClose,
  selectedTables,
  setSelectedTables,
  availableTables,
  onChairsSelected,
}) => {
  const [occupiedTables, setOccupiedTables] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch occupied tables when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchOccupiedTables();
    }
  }, [isOpen]);

  const fetchOccupiedTables = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/orders/occupied-tables`);
      setOccupiedTables(res.data);
    } catch (error) {
      console.error("Error fetching occupied tables:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[75vh] sm:max-h-[85vh] md:max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-2 sm:p-3 border-b shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">
                🎫 Select Your Table & Seats
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-2 sm:p-3">
              <TableSelect
                selectedTables={selectedTables}
                onSelectionChange={(tables) => {
                  setSelectedTables(tables);
                  if (onChairsSelected) onChairsSelected(tables);
                }}
                availableTables={availableTables}
                occupiedTables={occupiedTables}
                compact={true}
              />
            </div>

            {/* ✅ Confirm Button (only when table selected) */}
            {selectedTables.length > 0 && (
              <div className="p-3 border-t flex justify-center bg-white">
                <button
                  onClick={onClose}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all duration-200"
                >
                  Confirm Table
                </button>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TableSelectionModal;
