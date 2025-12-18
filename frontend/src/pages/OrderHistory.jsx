import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { useAppSelector } from "../store/hooks";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../config/api";
import OrderSlip from "../features/orders/OrderSlip";
import { getSocketConfig, isServerlessPlatform, createSocketConnection } from "../utils/socketConfig";
import { pollOrders } from "../utils/polling";
import OrderHistoryCard from "../features/orders/History/OrderHistoryCard";
import EmptyState from "../features/orders/History/EmptyState";
import HistoryFilters from "../features/orders/History/HistoryFilters";
import { motion, AnimatePresence } from "framer-motion";

const OrderHistory = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState([]);
  const socketRef = useRef(null);
  const pollingStopRef = useRef(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [orderType, setOrderType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // ✅ Fetch user's completed orders
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE}/api/orders`);
      // Filter for user's completed orders (check both email and userId)
      const userOrders = res.data.filter(
        (o) =>
          (o.userEmail === user.email || o.userId === user.uid)
      );
      // Sort by creation date (newest first)
      const sortedOrders = userOrders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
    } catch (err) {
      toast.error("Failed to fetch order history!");
      console.error(err);
    }
  }, [user]);

  // Filter and Sort Orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o._id.toLowerCase().includes(q) ||
          o.foodName.toLowerCase().includes(q)
      );
    }

    // 2. Date Range
    if (dateRange[0] && dateRange[1]) {
      const start = new Date(dateRange[0]);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange[1]);
      end.setHours(23, 59, 59, 999);
      
      result = result.filter((o) => {
        const date = new Date(o.createdAt);
        return date >= start && date <= end;
      });
    }

    // 3. Payment Status
    if (paymentStatus !== "all") {
      // Assuming 'paymentStatus' field exists or deriving logic
      if (paymentStatus === "paid") {
         // Logic for 'paid' - assuming status 'Paid' or similar
         // Since backend schema isn't fully visible, assuming 'paymentStatus' field.
         // If not, we might need to rely on order status 'Paid' if that's a thing, 
         // but status is 'Completed'. Assuming all completed are unpaid unless specified?
         // For now, let's filter by the 'status' field if it matches, OR 'paymentStatus'
         result = result.filter(o => o.paymentStatus === "Paid" || o.status === "Paid");
      } else if (paymentStatus === "pending") {
         result = result.filter(o => o.paymentStatus !== "Paid" && o.status !== "Paid");
      }
    }

    // 4. Order Type
    if (orderType !== "all") {
      if (orderType === "dinein") {
        result = result.filter((o) => o.isInRestaurant === true);
      } else if (orderType === "delivery") {
        result = result.filter((o) => o.isInRestaurant === false);
      }
    }

    return result;
  }, [orders, searchQuery, dateRange, paymentStatus, orderType]);


  // Group orders by order session (same date, same user)
  const groupOrdersBySession = useCallback((ordersList) => {
    const groups = {};
    ordersList.forEach((order) => {
      // Grouping by Order ID prefix or strict time window usually better,
      // but sticking to date+email logic as per existing code, 
      // OR maybe refine to group by 15-min window if needed.
      // Retaining existing logic for safety.
      const date = new Date(order.createdAt).toDateString();
      const key = `${date}_${order.userEmail}`; // Simple grouping
      
      // OPTIONAL IMPROVEMENT: Group by actual time proximity (e.g., within 30 mins)
      // For now, let's execute existing logic but sorted.
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });
    return Object.values(groups);
  }, []);

  // Group and sort orders for display
  const groupedOrders = useMemo(() => {
    // Group filtered orders
    const grouped = groupOrdersBySession(filteredOrders);

    // Sort grouped orders
    grouped.sort((a, b) => {
      const firstA = a[0];
      const firstB = b[0];
      const dateA = new Date(firstA.createdAt).getTime();
      const dateB = new Date(firstB.createdAt).getTime();
      const amountA = a.reduce((sum, o) => sum + (o.price || 0), 0);
      const amountB = b.reduce((sum, o) => sum + (o.price || 0), 0);

      if (sortBy === "newest") return dateB - dateA;
      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "highest") return amountB - amountA;
      if (sortBy === "lowest") return amountA - amountB;
      return 0;
    });

    return grouped;
  }, [filteredOrders, groupOrdersBySession, sortBy]);

  // Group orders by date labels (Today, Yesterday, etc.)
  const groupedByDate = useMemo(() => {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    groupedOrders.forEach((orderGroup) => {
      if (!orderGroup[0]) return;
      const orderDate = new Date(orderGroup[0].createdAt);
      const orderDateOnly = new Date(
        orderDate.getFullYear(),
        orderDate.getMonth(),
        orderDate.getDate()
      );
      
      let groupKey = "older";

      if (orderDateOnly.getTime() === today.getTime()) {
        groupKey = "today";
      } else if (orderDateOnly.getTime() === yesterday.getTime()) {
        groupKey = "yesterday";
      } else if (orderDateOnly >= thisWeek && orderDateOnly < today) {
        groupKey = "thisWeek";
      } else if (orderDateOnly >= thisMonth && orderDateOnly < thisWeek) {
        groupKey = "thisMonth";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(orderGroup);
    });

    return groups;
  }, [groupedOrders]);

  const dateGroupLabels = {
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    older: "Older",
  };

  // Handle view order slip
  const handleViewOrderSlip = (orderGroup) => {
    setSelectedOrderGroup(orderGroup);
    setShowOrderSlip(true);
  };

  useEffect(() => {
    fetchHistory();
  }, [user, fetchHistory]);

  // Real-time socket notifications and polling
  useEffect(() => {
    if (!user) return;

    const isServerless = isServerlessPlatform();

    if (!socketRef.current) {
      if (isServerless) {
        socketRef.current = {
          on: () => {},
          off: () => {},
          emit: () => {},
          disconnect: () => {},
          connect: () => {},
          connected: false,
        };
      } else {
        const socketConfig = getSocketConfig({
          type: "user",
          userId: user?.uid || null,
          autoConnect: true,
        });
        socketRef.current = createSocketConnection(API_BASE, socketConfig);
      }
    }
    const socket = socketRef.current;

    socket.on("connect", () => {
      if (socket && typeof socket.emit === "function" && user?.uid) {
        setTimeout(() => {
          socket.emit("identify", { type: "user", userId: user.uid });
        }, 100);
      }
    });

    socket.on("newOrderPlaced", (newOrder) => {
        if (newOrder.userEmail === user.email || newOrder.userId === user.uid) {
          setOrders((prev) => {
            const exists = prev.find((o) => o._id === newOrder._id);
            if (!exists) return [newOrder, ...prev];
            return prev;
          });
          toast.success(`📦 New Order: ${newOrder.foodName}`);
          fetchHistory();
        }
    });

    socket.on("orderStatusChanged", (updatedOrder) => {
      if (!user || !updatedOrder || !updatedOrder._id) return;

      const isUserOrder =
        updatedOrder.userEmail === user.email ||
        updatedOrder.userId === user.uid;

      if (!isUserOrder) return;

      if (updatedOrder.status === "Completed") {
        setOrders((prev) => {
          const existingIndex = prev.findIndex((o) => o._id === updatedOrder._id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...updatedOrder };
            return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          } else {
            toast.success(`🎉 Order Completed: ${updatedOrder.foodName}`);
            return [updatedOrder, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          }
        });
      } else {
        // Just update it if it already exists
        setOrders((prev) => {
          const existingIndex = prev.findIndex((o) => o._id === updatedOrder._id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...updatedOrder };
            return updated;
          }
          return [updatedOrder, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
      }
    });

    if (isServerless) {
      pollingStopRef.current = pollOrders(
        async () => {
             try {
               const res = await axios.get(`${API_BASE}/api/orders`);
               return res.data.filter(
                 (o) =>
                   (o.userEmail === user.email || o.userId === user.uid) &&
                   o.status === "Completed"
               );
             } catch (error) {
               return [];
             }
        },
        (newOrder) => {
             setOrders((prev) => {
               if(!prev.find(o => o._id === newOrder._id)) {
                  toast.success(`🎉 Order completed: ${newOrder.foodName}`);
                  return [newOrder, ...prev];
               }
               return prev;
             });
        },
        (updatedOrder, oldOrder) => {
           if (updatedOrder.status === "Completed" && oldOrder.status !== "Completed") {
               fetchHistory(); 
           }
        },
        3000
      );
    }

    return () => {
      socket.off("connect");
      socket.off("newOrderPlaced");
      socket.off("orderStatusChanged");
      if (pollingStopRef.current) {
        pollingStopRef.current();
        pollingStopRef.current = null;
      }
    };
  }, [user, fetchHistory]);

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-8 text-center sm:text-left"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Order History
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            View and track your past orders
          </p>
        </motion.div>

        {/* Filters Section */}
        <HistoryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={setPaymentStatus}
          orderType={orderType}
          onOrderTypeChange={setOrderType}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Content Area */}
        <div className="min-h-[400px]">
          {!user ? (
            <EmptyState type="noOrders" />
          ) : filteredOrders.length === 0 && orders.length > 0 ? (
             // Orders exist but filtered out
             <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-lg">No orders match your filters</p>
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setDateRange([null, null]);
                    setPaymentStatus("all");
                    setOrderType("all");
                  }}
                  className="mt-4 text-red-600 font-medium hover:underline"
                >
                  Clear Filters
                </button>
             </div>
          ) : orders.length === 0 ? (
            <EmptyState type="noOrders" onRefresh={fetchHistory} />
          ) : (
             <AnimatePresence mode="wait">
                <div className="space-y-8">
                  {Object.keys(dateGroupLabels).map((groupKey) => {
                    const groupOrders = groupedByDate[groupKey] || [];
                    if (groupOrders.length === 0) return null;

                    return (
                      <motion.div 
                        key={groupKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-3">
                           <h2 className="text-xl font-bold text-gray-800">
                             {dateGroupLabels[groupKey]}
                           </h2>
                           <div className="h-px flex-1 bg-gray-200"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {groupOrders.map((orderGroup, index) => (
                            <OrderHistoryCard
                              key={`${orderGroup[0]._id}-${index}`}
                              orderGroup={orderGroup}
                              onViewSlip={handleViewOrderSlip}
                            />
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
             </AnimatePresence>
          )}
        </div>
      </div>

      {/* Order Slip Modal */}
      <OrderSlip
        isOpen={showOrderSlip}
        onClose={() => {
          setShowOrderSlip(false);
          setSelectedOrderGroup([]);
        }}
        orders={selectedOrderGroup}
        totalAmount={
          selectedOrderGroup.reduce((sum, o) => sum + (o.price || 0), 0)
        }
        userName={user?.displayName || "Guest User"}
        userEmail={user?.email || ""}
        orderDate={selectedOrderGroup[0]?.createdAt || new Date()}
      />
    </div>
  );
};

export default OrderHistory;
