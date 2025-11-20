import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/authContext";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../config/api";

const OrderHistory = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch user's completed orders
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/orders`);
      const userOrders = res.data.filter(
        (o) => o.userEmail === user.email && o.status === "Completed"
      );
      setOrders(userOrders.reverse());
    } catch (err) {
      toast.error("Failed to fetch order history!");
      console.error(err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [user, fetchHistory]);

  return (
    <div className="px-4 sm:px-6 md:px-10 py-8 min-h-screen bg-gradient-to-b from-yellow-50 to-white mt-10">
      <Toaster />
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center text-red-700 mb-6">
        📜 My Order History
      </h2>

      {/* Handle States */}
      {!user ? (
        <p className="text-center text-gray-600 text-sm sm:text-base">
          Please login to view your order history.
        </p>
      ) : loading ? (
        <p className="text-center text-gray-600 text-sm sm:text-base">
          Loading your history...
        </p>
      ) : orders.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            You have no completed orders yet.
          </p>
          <button
            onClick={fetchHistory}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base transition"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5 md:space-y-6 max-w-4xl mx-auto">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-100 p-4 sm:p-5 md:p-6"
            >
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-1 sm:mb-0">
                  {order.foodName}
                </h3>
                <span className="text-xs sm:text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Order Details */}
              <p className="text-sm sm:text-base text-gray-600">
                Table:{" "}
                <span className="font-medium">{order.tableNumber}</span> | Qty:{" "}
                <span className="font-medium">{order.quantity}</span> | Price:{" "}
                <span className="font-semibold text-red-600">
                  ₹{order.price}
                </span>
              </p>

              <p className="text-xs sm:text-sm text-gray-500 mt-1 capitalize">
                {order.category} • {order.type}
              </p>

              {/* Status Badge */}
              <div className="mt-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                    order.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Refresh Button (for mobile users convenience) */}
      {user && orders.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={fetchHistory}
            className="bg-red-600 hover:bg-red-700 text-white px-5 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base shadow-md transition"
          >
            🔄 Refresh Orders
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
