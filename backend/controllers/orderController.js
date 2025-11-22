import Order from "../models/orderModel.js";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

// 📦 Get all orders
export const getOrders = async (req, res) => {
  try {
    // Ensure database connection (for serverless) with retry logic
    let retries = 0;
    const maxRetries = 3;
    
    while (mongoose.connection.readyState !== 1 && retries < maxRetries) {
      console.log(`🔄 Establishing database connection for getOrders... (Attempt ${retries + 1}/${maxRetries})`);
      
      const connectionResult = await connectDB();
      
      // Wait a bit for connection to be fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (mongoose.connection.readyState === 1) {
        console.log("✅ Database connection established for getOrders");
        break;
      }
      
      retries++;
      
      if (retries < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // Verify connection is ready before querying
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ Database not connected after retries. ReadyState:", mongoose.connection.readyState);
      return res.status(503).json({ 
        success: false,
        message: "Database connection unavailable. Please try again later.",
        error: process.env.NODE_ENV === "development" ? `ReadyState: ${mongoose.connection.readyState}` : undefined
      });
    }

    // Query orders with timeout protection
    const orders = await Promise.race([
      Order.find().sort({ createdAt: -1 }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Query timeout")), 10000)
      )
    ]);
    
    console.log(`✅ Fetched ${orders.length} orders successfully`);
    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    
    // Check if it's a database connection error
    if (error.name === "MongoServerSelectionError" || 
        error.message.includes("connection") || 
        error.message.includes("timeout")) {
      return res.status(503).json({ 
        success: false,
        message: "Database connection error. Please try again later.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ➕ Create single order
export const createOrder = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for createOrder...");
      await connectDB();
    }

    // ✅ Validation
    const { userEmail, tableNumber, foodName, quantity, price } = req.body;
    
    // Allow tableNumber to be 0 for takeaway/delivery orders
    if (!userEmail || (tableNumber === undefined || tableNumber === null) || !foodName || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: "Please provide userEmail, tableNumber, foodName, quantity, and price",
      });
    }

    if (Number(quantity) <= 0 || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity and price must be positive numbers",
      });
    }

    const order = new Order(req.body);
    await order.save();

    // ✅ Emit new order to Admin (real-time) - Use room-based broadcasting
    const io = req.app.get("io");
    if (io && typeof io.to === "function") {
      // Emit to admins room for faster delivery
      io.to("admins").emit("newOrderPlaced", order);
      // Also emit to specific user if userId exists
      if (order.userId) {
        io.to(`user:${order.userId}`).emit("newOrderPlaced", order);
      }
      console.log("📦 Emitted newOrderPlaced event for order:", order._id);
    } else if (io && typeof io.emit === "function") {
      // Fallback for non-room-based setup
      io.emit("newOrderPlaced", order);
      console.log("📦 Emitted newOrderPlaced event for order:", order._id);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// ➕ Create multiple orders (used in multi-food checkout)
export const createMultipleOrders = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for createMultipleOrders...");
      await connectDB();
    }

    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order data" });
    }

    // ✅ Validate each order
    for (const order of req.body) {
      // Allow tableNumber to be 0 for takeaway/delivery orders
      if (!order.userEmail || (order.tableNumber === undefined || order.tableNumber === null) || !order.foodName || !order.quantity || !order.price) {
        return res.status(400).json({
          success: false,
          message: "Each order must have userEmail, tableNumber, foodName, quantity, and price",
        });
      }
      
      if (Number(order.quantity) <= 0 || Number(order.price) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity and price must be positive numbers",
        });
      }
    }

    const orders = await Order.insertMany(req.body);

    // ✅ Emit socket event for each new order to Admin - Use room-based broadcasting
    const io = req.app.get("io");
    if (io && typeof io.to === "function") {
      orders.forEach((order) => {
        // Emit to admins room for faster delivery
        io.to("admins").emit("newOrderPlaced", order);
        // Also emit to specific user if userId exists
        if (order.userId) {
          io.to(`user:${order.userId}`).emit("newOrderPlaced", order);
        }
        console.log("📦 Emitted newOrderPlaced event for order:", order._id);
      });
    } else if (io && typeof io.emit === "function") {
      // Fallback for non-room-based setup
      orders.forEach((order) => {
        io.emit("newOrderPlaced", order);
        console.log("📦 Emitted newOrderPlaced event for order:", order._id);
      });
    }

    res.status(201).json({
      success: true,
      message: "Multiple orders created successfully",
      orders,
    });
  } catch (error) {
    console.error("Error creating multiple orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create multiple orders",
    });
  }
};

// 🔄 Update order status (Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for updateOrderStatus...");
      await connectDB();
    }

    const { id } = req.params;
    const { status, paymentStatus, paymentMethod } = req.body;

    // ✅ Build update object
    const updateData = {};
    
    if (status) {
      const validStatuses = ["Pending", "Cooking", "Ready", "Served", "Completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        });
      }
      updateData.status = status;
    }

    if (paymentStatus) {
      const validPaymentStatuses = ["Unpaid", "Paid"];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Payment status must be one of: ${validPaymentStatuses.join(", ")}`,
        });
      }
      updateData.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      const validPaymentMethods = ["UPI", "Cash", "Other"];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: `Payment method must be one of: ${validPaymentMethods.join(", ")}`,
        });
      }
      updateData.paymentMethod = paymentMethod;
    }

    // ✅ At least one field must be provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide status, paymentStatus, or paymentMethod to update",
      });
    }

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ Emit socket events for live updates - Use room-based broadcasting
    const io = req.app.get("io");
    if (io && typeof io.to === "function") {
      // ✅ Emit order status change to admins and user (by userId and userEmail)
      if (updateData.status) {
        // Emit to admins room
        io.to("admins").emit("orderStatusChanged", order);
        
        // ✅ Emit to user by userId (if available) - most efficient
        if (order.userId) {
          io.to(`user:${order.userId}`).emit("orderStatusChanged", order);
        }
        
        // ✅ Also emit to "users" room as fallback - clients will filter by userEmail
        // This ensures users get updates even if userId room join failed
        io.to("users").emit("orderStatusChanged", order);
        
        console.log("🔄 Emitted orderStatusChanged event for order:", order._id, "Status:", order.status, "User:", order.userEmail || order.userId);
      }
      // ✅ Emit payment success if payment status changed to Paid
      if (updateData.paymentStatus === "Paid") {
        io.to("admins").emit("paymentSuccess", order);
        if (order.userId) {
          io.to(`user:${order.userId}`).emit("paymentSuccess", order);
        }
        // ✅ Also emit to "users" room as fallback
        io.to("users").emit("paymentSuccess", order);
        console.log("💰 Emitted paymentSuccess event for order:", order._id);
      }
    } else if (io && typeof io.emit === "function") {
      // Fallback for non-room-based setup
      if (updateData.status) {
        io.emit("orderStatusChanged", order);
        console.log("🔄 Emitted orderStatusChanged event for order:", order._id, "Status:", order.status);
      }
      if (updateData.paymentStatus === "Paid") {
        io.emit("paymentSuccess", order);
        console.log("💰 Emitted paymentSuccess event for order:", order._id);
      }
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order",
    });
  }
};

// ❌ Delete completed order (User)
export const deleteOrder = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for deleteOrder...");
      await connectDB();
    }

    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow delete if status is "Completed"
    if (order.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "You can only delete completed orders",
      });
    }

    await Order.findByIdAndDelete(id);

    // ✅ Emit delete event for real-time sync (to admin + other clients)
    const io = req.app.get("io");
    if (io && typeof io.emit === "function") {
      io.emit("orderDeleted", id);
      console.log("🗑️ Emitted orderDeleted event for order:", id);
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      deletedOrderId: id,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
    });
  }
};
