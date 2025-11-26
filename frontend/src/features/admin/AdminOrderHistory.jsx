import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import API_BASE from "../../config/api";
import { getSocketConfig, isServerlessPlatform, createSocketConnection } from "../../utils/socketConfig";
import LogoLoader from "../../components/ui/LogoLoader";
import OrderSlip from "../orders/OrderSlip";
import { FaReceipt, FaChair, FaPhone } from "react-icons/fa";

const AdminOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState([]);
  const socketRef = useRef(null);

  // Fetch all completed orders
  const fetchCompletedOrders = async () => {

    try {
      const res = await axios.get(`${API_BASE}/api/orders`);
      const completedOrders = res.data.filter((o) => o.status === "Completed");
      setOrders(completedOrders.reverse());
    } catch (err) {
      toast.error("Failed to fetch order history!");
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  // Real-time socket updates
  useEffect(() => {
    const isServerless = isServerlessPlatform();
    
    if (!socketRef.current) {
      if (isServerless) {
        // On serverless platforms, create a mock socket
        socketRef.current = {
          on: () => {},
          off: () => {},
          emit: () => {},
          disconnect: () => {},
          connect: () => {},
          connected: false,
        };
      } else {
        // On regular servers, create real socket connection safely
        const socketConfig = getSocketConfig();
        socketRef.current = createSocketConnection(API_BASE, socketConfig);
      }
    }
    const socket = socketRef.current;

    // Listen for order status changes
    socket.on("orderStatusChanged", (updatedOrder) => {
      if (updatedOrder.status === "Completed") {
        // Add to history if not already present
        setOrders((prev) => {
          const exists = prev.find((o) => o._id === updatedOrder._id);
          if (!exists) {
            return [updatedOrder, ...prev];
          }
          return prev.map((o) =>
            o._id === updatedOrder._id ? updatedOrder : o
          );
        });
        toast.success(`Order completed: ${updatedOrder.foodName}`, {
          duration: 3000,
        });
      } else {
        // Remove from history if status changed from Completed
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
      }
    });

    return () => {
      socket.off("orderStatusChanged");
    };
  }, []);

  // Group orders by order session (same table, same date, same user)
  const groupOrdersBySession = (ordersList) => {
    const groups = {};
    ordersList.forEach((order) => {
      const date = new Date(order.createdAt).toDateString();
      const key = `${date}_${order.userEmail}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });
    return Object.values(groups);
  };

  // Handle view order slip
  const handleViewOrderSlip = (orderGroup) => {
    setSelectedOrderGroup(orderGroup);
    setShowOrderSlip(true);
  };

  if (loading) return <LogoLoader />;

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full bg-gradient-to-b from-yellow-50 to-white min-h-screen pb-30 md:pb-6 mt-12">
      <Toaster />
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-red-700 text-center">
        📜 Admin Order History
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-sm sm:text-base">
            No completed orders yet.
          </p>
          <button
            onClick={fetchCompletedOrders}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base transition shadow-md"
          >
            Refresh
          </button>
          
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          {groupOrdersBySession(orders).map((orderGroup, groupIndex) => {
            const firstOrder = orderGroup[0];
            const totalAmount = orderGroup.reduce((sum, o) => sum + (o.price || 0), 0);
            
            return (
              <motion.div
                key={`group-${groupIndex}-${firstOrder._id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white shadow-md hover:shadow-lg transition-all rounded-lg sm:rounded-xl border border-gray-100 p-3 sm:p-4 md:p-5 lg:p-6"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3 sm:mb-4 gap-2">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-800 mb-1">
                      Order #{firstOrder._id?.slice(-8).toUpperCase() || "ORDER"}
                    </h3>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {new Date(firstOrder.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-red-600">
                      Total: ₹{totalAmount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleViewOrderSlip(orderGroup)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
                    >
                      <FaReceipt /> View Slip
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-3 border-b border-gray-200 pb-3">
                  {orderGroup.map((order) => (
                    <div key={order._id} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {order.foodName}
                          {order.selectedSize && (
                            <span className="ml-1 text-xs text-orange-600 font-semibold">
                              ({order.selectedSize})
                            </span>
                          )}
                          {" "}× {order.quantity}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {order.category} • {order.type}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-700 ml-2">
                        ₹{Number(order.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{firstOrder.userName || "Guest"}</span>
                  </div>
                  <span className="hidden sm:inline">|</span>
                  <span>
                    Items: <span className="font-medium">{orderGroup.length}</span>
                  </span>
                </div>

                {/* Table Badge or Phone Number Display */}
                {(() => {
                  const hasTable = firstOrder.tableNumber && typeof firstOrder.tableNumber === 'number' && firstOrder.tableNumber > 0;
                  const hasContact = firstOrder.contactNumber && typeof firstOrder.contactNumber === 'string' && firstOrder.contactNumber.trim() !== '';
                  
                  // Helper function to get all chair letters
                  const getChairDisplay = () => {
                    if (firstOrder.chairLetters && typeof firstOrder.chairLetters === 'string' && firstOrder.chairLetters.trim() !== '') {
                      const letters = firstOrder.chairLetters.trim();
                      if (letters.includes(' ')) {
                        return letters;
                      } else if (letters.length > 1) {
                        return letters.split('').join(' ');
                      }
                      return letters;
                    }
                    if (firstOrder.chairIndices && Array.isArray(firstOrder.chairIndices) && firstOrder.chairIndices.length > 0) {
                      const sortedIndices = [...firstOrder.chairIndices].sort((a, b) => a - b);
                      return sortedIndices.map(idx => String.fromCharCode(97 + idx)).join(' ');
                    }
                    if (firstOrder.chairsBooked > 0) {
                      return `${firstOrder.chairsBooked} seat${firstOrder.chairsBooked > 1 ? "s" : ""}`;
                    }
                    return '';
                  };
                  
                  const chairDisplay = getChairDisplay();
                  
                  if (hasTable) {
                    return (
                      <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-50 border border-red-300 rounded-lg">
                        <FaChair className="text-red-600 text-xs sm:text-sm flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-red-700">
                          Table {firstOrder.tableNumber}
                          {chairDisplay ? ` (${chairDisplay})` : ''}
                        </span>
                      </div>
                    );
                  } else if (hasContact) {
                    return (
                      <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 border border-blue-300 rounded-lg">
                        <FaPhone className="text-blue-600 text-xs sm:text-sm flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-blue-700">
                          📞 {firstOrder.contactNumber} (Delivery/Parcel)
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Status Badge */}
                <div className="mt-2 sm:mt-3">
                  <span className="inline-block px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-green-100 text-green-700">
                    {firstOrder.status}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Slip Modal */}
      <OrderSlip
        isOpen={showOrderSlip}
        onClose={() => {
          setShowOrderSlip(false);
          setSelectedOrderGroup([]);
        }}
        orders={selectedOrderGroup}
        totalAmount={selectedOrderGroup.reduce((sum, o) => sum + (o.price || 0), 0)}
        userName={selectedOrderGroup[0]?.userName || "Guest User"}
        userEmail={selectedOrderGroup[0]?.userEmail || ""}
        orderDate={selectedOrderGroup[0]?.createdAt || new Date()}
      />
    </div>
  );
};

export default AdminOrderHistory;

