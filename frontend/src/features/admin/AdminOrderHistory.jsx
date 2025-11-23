import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import API_BASE from "../../config/api";
import { getSocketConfig, isServerlessPlatform, createSocketConnection } from "../../utils/socketConfig";
import LogoLoader from "../../components/ui/LogoLoader";
import OrderSlip from "../orders/OrderSlip";
import { FaReceipt } from "react-icons/fa";

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
      const key = `${order.tableNumber}_${date}_${order.userEmail}`;
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
            const totalWithGST = totalAmount * 1.05;
            
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
                      Total: ₹{totalWithGST.toFixed(2)}
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
                  {firstOrder.isInRestaurant === false ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-blue-600 font-medium">🚚 Delivery</span>
                      {firstOrder.contactNumber && (
                        <span className="text-xs text-gray-600">📞 {firstOrder.contactNumber}</span>
                      )}
                      {firstOrder.deliveryLocation && (
                        <span className="text-xs text-gray-600">
                          📍 {firstOrder.deliveryLocation.address 
                            ? firstOrder.deliveryLocation.address.substring(0, 40) + (firstOrder.deliveryLocation.address.length > 40 ? "..." : "")
                            : firstOrder.deliveryLocation.latitude && firstOrder.deliveryLocation.longitude
                            ? `${firstOrder.deliveryLocation.latitude.toFixed(4)}, ${firstOrder.deliveryLocation.longitude.toFixed(4)}`
                            : "Location not available"}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-green-600 font-medium">
                      🍽️ Dine-in - Table: <span className="font-semibold">{firstOrder.tableNumber}</span>
                    </span>
                  )}
                  <span className="hidden sm:inline">|</span>
                  <span>
                    Items: <span className="font-medium">{orderGroup.length}</span>
                  </span>
                  <span className="hidden sm:inline">|</span>
                  <span>
                    Payment:{" "}
                    <span className={`font-semibold ${
                      firstOrder.paymentStatus === "Paid" ? "text-green-600" : "text-yellow-600"
                    }`}>
                      {firstOrder.paymentStatus === "Paid" ? "✅ Paid" : "💳 Pending"}
                    </span>
                  </span>
                  <span className="hidden sm:inline">|</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    firstOrder.paymentMethod === "Cash" 
                      ? "bg-yellow-100 text-yellow-700" 
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {firstOrder.paymentMethod === "Cash" ? "💵 Cash" : "📱 UPI"}
                  </span>
                </div>

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
        totalAmount={selectedOrderGroup.reduce((sum, o) => sum + (o.price || 0), 0) * 1.05}
        tableNumber={selectedOrderGroup[0]?.tableNumber || 0}
        selectedChairsCount={1}
        isInRestaurant={selectedOrderGroup[0]?.isInRestaurant !== false}
        userName={selectedOrderGroup[0]?.userName || "Guest User"}
        userEmail={selectedOrderGroup[0]?.userEmail || ""}
        orderDate={selectedOrderGroup[0]?.createdAt || new Date()}
      />
    </div>
  );
};

export default AdminOrderHistory;

