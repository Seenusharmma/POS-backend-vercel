import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../../config/api";

const AdminPanel = () => {
  const [, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [foodForm, setFoodForm] = useState({
    name: "",
    category: "",
    type: "",
    price: "",
  });
  const [image, setImage] = useState(null);
  const socketRef = useRef(null);

  // ✅ Fetch Data
  const getAllData = async () => {
    try {
      const [foodRes, orderRes] = await Promise.all([
        axios.get(`${API_BASE}/api/foods`),
        axios.get(`${API_BASE}/api/orders`),
      ]);
      setFoods(foodRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    }
  };

  // ✅ Initialize Socket.IO
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(API_BASE, {
        transports: ["websocket"],
        withCredentials: false,
        reconnection: true,
      });
    }

    const socket = socketRef.current;
    getAllData();

    socket.on("newOrderPlaced", (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      toast.success(
        `🆕 New order from Table ${newOrder.tableNumber}: ${newOrder.foodName}`,
        { position: "top-right" }
      );
    });

    socket.on("orderStatusChanged", (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === updatedOrder._id ? { ...o, status: updatedOrder.status } : o
        )
      );
    });

    socket.on("newFoodAdded", (food) => {
      setFoods((prev) => [...prev, food]);
      toast(`🍛 New food added: ${food.name}`, { position: "bottom-right" });
    });

    socket.on("foodUpdated", (food) => {
      setFoods((prev) =>
        prev.map((f) => (f._id === food._id ? food : f))
      );
      toast(`🔄 Menu updated: ${food.name}`, { position: "bottom-right" });
    });

    socket.on("foodDeleted", (id) => {
      setFoods((prev) => prev.filter((f) => f._id !== id));
      toast.error("❌ A food item was removed", { position: "bottom-right" });
    });

    return () => {
      socket.off("newOrderPlaced");
      socket.off("orderStatusChanged");
      socket.off("newFoodAdded");
      socket.off("foodUpdated");
      socket.off("foodDeleted");
    };
  }, []);

  // ✅ Form Handlers
  const handleChange = (e) =>
    setFoodForm({ ...foodForm, [e.target.name]: e.target.value });

  const handleImage = (e) => setImage(e.target.files[0]);

  const addFood = async () => {
    try {
      const formData = new FormData();
      Object.entries(foodForm).forEach(([key, value]) =>
        formData.append(key, value)
      );
      if (image) formData.append("image", image);

      const res = await axios.post(`${API_BASE}/api/foods/add`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFoodForm({ name: "", category: "", type: "", price: "" });
      setImage(null);
      setFoods((prev) => [...prev, res.data.food]);
      socketRef.current.emit("newFoodAdded", res.data.food);

      toast.success("✅ Food added successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add food");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(`${API_BASE}/api/orders/${id}`, { status });
      const updatedOrder = res.data.order || res.data;
      setOrders((prev) =>
        prev.map((o) =>
          o._id === updatedOrder._id ? { ...o, status: updatedOrder.status } : o
        )
      );

      socketRef.current.emit("orderUpdated", updatedOrder);
      toast.success(`Order #${updatedOrder._id.slice(-5)} → ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <Toaster />
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-red-700 text-center">
        🍴 Admin Dashboard
      </h2>

      {/* Add Food Section */}
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-10">
        <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-800 text-center sm:text-left">
          ➕ Add New Food
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <input
            name="name"
            placeholder="Food Name"
            value={foodForm.name}
            onChange={handleChange}
            className="border p-2 rounded text-sm sm:text-base"
          />
          <input
            name="category"
            placeholder="Category"
            value={foodForm.category}
            onChange={handleChange}
            className="border p-2 rounded text-sm sm:text-base"
          />
          <input
            name="type"
            placeholder="Type (Veg/Non-Veg)"
            value={foodForm.type}
            onChange={handleChange}
            className="border p-2 rounded text-sm sm:text-base"
          />
          <input
            name="price"
            placeholder="Price ₹"
            value={foodForm.price}
            onChange={handleChange}
            className="border p-2 rounded text-sm sm:text-base"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="border p-2 rounded text-sm sm:text-base"
          />
        </div>

        <button
          onClick={addFood}
          className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto px-6 py-2 mt-4 rounded-md font-medium transition-all"
        >
          Add Food
        </button>
      </div>

      {/* Orders Section */}
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 text-center sm:text-left">
          📦 Live Orders
        </h3>

        <div className="max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          {orders.length === 0 ? (
            <p className="text-center text-gray-600">No Orders Yet</p>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="border-b py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              >
                <div className="text-sm sm:text-base">
                  {/* Username Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                      👤 {order.userName || "Guest User"}
                    </span>
                    {order.userEmail && (
                      <span className="text-xs text-gray-500">
                        📧 {order.userEmail}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800">
                    Table {order.tableNumber}: {order.foodName}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 capitalize">
                    {order.type} | Qty: {order.quantity}
                  </p>
                  <p className="text-sm">
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        order.status === "Pending"
                          ? "text-yellow-600"
                          : order.status === "Cooking"
                          ? "text-blue-600"
                          : order.status === "Ready"
                          ? "text-purple-600"
                          : "text-green-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </p>
                </div>

                <select
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  value={order.status}
                  className="border rounded p-2 text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option>Pending</option>
                  <option>Cooking</option>
                  <option>Ready</option>
                  <option>Served</option>
                  <option>Completed</option>
                </select>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
