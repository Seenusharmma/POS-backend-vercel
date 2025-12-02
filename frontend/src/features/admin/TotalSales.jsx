import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { FaDollarSign, FaChartLine, FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaTrophy, FaArrowUp } from "react-icons/fa";
import API_BASE from "../../config/api";
import { getSocketConfig, isServerlessPlatform, createSocketConnection } from "../../utils/socketConfig";
import LogoLoader from "../../components/ui/LogoLoader";

const TotalSales = () => {
  const [orders, setOrders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("today"); // "today", "backDate", "365days"
  const [selectedDate, setSelectedDate] = useState("");
  const socketRef = useRef(null);

  // ================================
  // 🧾 Fetch Orders + Realtime Updates
  // ================================
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/orders`);
      setOrders(res.data);
    } catch {
      toast.error("Failed to fetch sales data");
    } finally {
      setTimeout(() => setPageLoading(false), 800);
    }
  };

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
    fetchOrders();

    socket.on("newOrderPlaced", fetchOrders);
    socket.on("orderStatusChanged", fetchOrders);
    socket.on("paymentSuccess", fetchOrders);
    socket.on("orderDeleted", fetchOrders);

    return () => socket.disconnect();
  }, []);

  if (pageLoading) return <LogoLoader />;

  // ================================
  // 📅 Date Filtering Logic
  // ================================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getFilteredOrders = () => {
    let filtered = orders.filter(
      (o) => o.status === "Completed"
    );

    if (dateFilter === "today") {
      // Today's orders
      filtered = filtered.filter((o) => {
        const d = new Date(o.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (dateFilter === "backDate" && selectedDate) {
      // Selected back date
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      filtered = filtered.filter((o) => {
        const d = new Date(o.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === selected.getTime();
      });
    } else if (dateFilter === "365days") {
      // Past 365 days
      const past365Days = new Date(today);
      past365Days.setDate(today.getDate() - 365);
      filtered = filtered.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= past365Days && d <= today;
      });
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // ================================
  // 💰 Calculations (based on filtered orders)
  // ================================
  const totalSales = filteredOrders.reduce(
    (sum, o) => sum + Number(o.price || 0),
    0
  );

  const todaySales = filteredOrders
    .filter((o) => {
      const d = new Date(o.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })
    .reduce((sum, o) => sum + Number(o.price || 0), 0);

  const last7DaysSales = filteredOrders
    .filter((o) => {
      const d = new Date(o.createdAt);
      const diff = (today - d) / (1000 * 60 * 60 * 24);
      return diff <= 7 && diff >= 0;
    })
    .reduce((sum, o) => sum + Number(o.price || 0), 0);

  const thisMonthSales = filteredOrders
    .filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, o) => sum + Number(o.price || 0), 0);

  // Get order count for filtered data
  const orderCount = filteredOrders.length;

  // ================================
  // 🍕 Top Selling Items (based on filtered orders)
  // ================================
  const itemCount = {};
  filteredOrders.forEach((o) => {
    if (!itemCount[o.foodName]) itemCount[o.foodName] = 0;
    itemCount[o.foodName] += o.quantity;
  });

  const topItems = Object.entries(itemCount)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // ================================
  // 📊 Chart Data (based on date filter)
  // ================================
  const getChartData = () => {
    if (dateFilter === "today") {
      // Hourly data for today
      const hours = Array.from({ length: 24 }).map((_, i) => {
        const hour = i.toString().padStart(2, "0");
        const hourSales = filteredOrders
          .filter((o) => {
            const d = new Date(o.createdAt);
            return d.getHours() === i;
          })
          .reduce((sum, o) => sum + Number(o.price || 0), 0);
        return { day: `${hour}:00`, sales: hourSales };
      });
      return hours;
    } else if (dateFilter === "backDate" && selectedDate) {
      // Hourly data for selected date
      const selected = new Date(selectedDate);
      const hours = Array.from({ length: 24 }).map((_, i) => {
        const hour = i.toString().padStart(2, "0");
        const hourSales = filteredOrders
          .filter((o) => {
            const d = new Date(o.createdAt);
            return d.getDate() === selected.getDate() && d.getHours() === i;
          })
          .reduce((sum, o) => sum + Number(o.price || 0), 0);
        return { day: `${hour}:00`, sales: hourSales };
      });
      return hours;
    } else if (dateFilter === "365days") {
      // Monthly data for past 365 days
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(today.getMonth() - i);
        const monthLabel = d.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        });
        const monthSales = filteredOrders
          .filter((o) => {
            const od = new Date(o.createdAt);
            return (
              od.getMonth() === d.getMonth() &&
              od.getFullYear() === d.getFullYear()
            );
          })
          .reduce((sum, o) => sum + Number(o.price || 0), 0);
        months.push({ day: monthLabel, sales: monthSales });
      }
      return months;
    } else {
      // Default: Last 7 days
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const dateLabel = d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
        const daySales = filteredOrders
          .filter((o) => {
            const od = new Date(o.createdAt);
            od.setHours(0, 0, 0, 0);
            const day = new Date(d);
            day.setHours(0, 0, 0, 0);
            return od.getTime() === day.getTime();
          })
          .reduce((sum, o) => sum + Number(o.price || 0), 0);
        return { day: dateLabel, sales: daySales };
      });
    }
  };

  const chartData = getChartData();

 // ================================
  // 🧭 UI
  // ================================
  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto min-h-screen">
      <Toaster />
      
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Sales Analytics
          </h1>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-sm border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Live Data</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs sm:text-sm">
          Monitor your sales performance and revenue insights
        </p>
      </motion.div>

      {/* 📅 Date Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-lg flex items-center justify-center">
            <FaCalendarAlt className="text-orange-500 text-base sm:text-lg" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800">
            Filter Period
          </h3>
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <button
            onClick={() => {
              setDateFilter("today");
              setSelectedDate("");
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              dateFilter === "today"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <FaCalendarDay className="text-base sm:text-lg" />
            <span>Today</span>
          </button>
          
          <button
            onClick={() => {
              setDateFilter("backDate");
              if (!selectedDate) {
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                setSelectedDate(yesterday.toISOString().split("T")[0]);
              }
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              dateFilter === "backDate"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <FaCalendarAlt className="text-base sm:text-lg" />
            <span className="text-center">Custom</span>
          </button>
         
          <button
            onClick={() => {
              setDateFilter("365days");
              setSelectedDate("");
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              dateFilter === "365days"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <FaChartLine className="text-base sm:text-lg" />
            <span className="text-center">365 Days</span>
          </button>
        </div>

        {/* Date Picker (shown when backDate is selected) */}
        {dateFilter === "backDate" && (
          <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today.toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 border-2 border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
        )}

        {/* Selected Date Display */}
        <div className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
            <span className="font-bold">Period:</span>
            {dateFilter === "today" && (
              <span className="font-semibold">
                {today.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
            {dateFilter === "backDate" && selectedDate && (
              <span className="font-semibold">
                {new Date(selectedDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
            {dateFilter === "365days" && (
              <span className="font-semibold">
                {new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}{" "}
                - {today.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Summary for filtered data */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">
                Orders: <span className="font-bold text-gray-900">{orderCount}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                Revenue: <span className="font-bold text-green-600 text-sm sm:text-base">₹{totalSales.toLocaleString("en-IN")}</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 💵 Summary Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
      >
        {[
          { 
            label: "Today's Sales", 
            amount: todaySales, 
            icon: FaCalendarDay,
            gradient: "from-blue-500 to-cyan-500",
            bgGradient: "from-blue-50 to-cyan-50"
          },
          { 
            label: "Last 7 Days", 
            amount: last7DaysSales, 
            icon: FaCalendarWeek,
            gradient: "from-purple-500 to-pink-500",
            bgGradient: "from-purple-50 to-pink-50"
          },
          { 
            label: "This Month", 
            amount: thisMonthSales, 
            icon: FaChartLine,
            gradient: "from-green-500 to-emerald-500",
            bgGradient: "from-green-50 to-emerald-50"
          },
          { 
            label: "Total Collection", 
            amount: totalSales, 
            icon: FaDollarSign,
            gradient: "from-orange-500 to-red-500",
            bgGradient: "from-orange-50 to-red-50"
          },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 shadow-lg border border-white/50 relative overflow-hidden`}
            >
              {/* Decorative Background */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full -mr-10 -mt-10`}></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 bg-gradient-to-br ${card.gradient} rounded-xl shadow-md`}>
                    <Icon className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-semibold mb-2">
                  {card.label}
                </h3>
                <p className={`text-3xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                  ₹{card.amount.toLocaleString("en-IN")}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 📊 Sales Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8 mb-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
              {dateFilter === "today"
                ? "Today's Sales Performance"
                : dateFilter === "backDate"
                ? "Selected Date Sales Performance"
                : dateFilter === "365days"
                ? "Annual Sales Trend"
                : "Weekly Sales Performance"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {dateFilter === "today" || dateFilter === "backDate"
                ? "Hourly breakdown"
                : dateFilter === "365days"
                ? "Monthly overview"
                : "Daily breakdown"}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 px-3 sm:px-4 py-2 rounded-lg">
            <FaChartLine className="text-orange-500" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Trend Analysis</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              angle={dateFilter === "365days" ? -45 : 0}
              textAnchor={dateFilter === "365days" ? "end" : "middle"}
              height={dateFilter === "365days" ? 80 : 30}
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Sales"]}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone"
              dataKey="sales" 
              stroke="#f97316"
              strokeWidth={3}
              fill="url(#colorSales)"
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6, fill: '#dc2626' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* 🍕 Top Selling Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-md">
            <FaTrophy className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Top Selling Items
            </h3>
            <p className="text-sm text-gray-500">Best performing products</p>
          </div>
        </div>
        {topItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No sales data available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ x: 5, scale: 1.01 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                    i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    i === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                    i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                    'bg-gradient-to-br from-gray-300 to-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="font-semibold text-gray-800 text-base">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold text-sm shadow-md">
                    {item.qty} sold
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TotalSales;
