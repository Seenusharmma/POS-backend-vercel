
import Order from "../models/orderModel.js";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { getCache, setCache, invalidateCache, CACHE_KEYS, CACHE_TTL } from "../utils/cache.js";
import { sendPushToUser } from "../utils/sendPushNotification.js";

// 📦 Get all orders
export const getOrders = async (req, res) => {
  try {
    // Try to get from cache first
    const cachedOrders = await getCache(CACHE_KEYS.ORDERS);
    if (cachedOrders !== null) {
      console.log("✅ Serving orders from cache");
      return res.status(200).json(cachedOrders);
    }

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
    
    // Cache the result
    await setCache(CACHE_KEYS.ORDERS, orders, CACHE_TTL.ORDERS);
    console.log(`✅ Orders cached for ${CACHE_TTL.ORDERS} seconds`);
    
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
    const { userEmail, foodName, quantity, price } = req.body;
    
    if (!userEmail || !foodName || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: "Please provide userEmail, foodName, quantity, and price",
      });
    }
    
    // Set default tableNumber to 0
    if (req.body.tableNumber === undefined || req.body.tableNumber === null) {
      req.body.tableNumber = 0;
    }

    if (Number(quantity) <= 0 || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity and price must be positive numbers",
      });
    }

    const order = new Order(req.body);
    await order.save();

    // ✅ Invalidate orders cache
    await invalidateCache(CACHE_KEYS.ORDERS);

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

    // 📱 Send push notification to user
    if (order.userEmail) {
      sendPushToUser(
        order.userEmail,
        "📦 Order Placed!",
        `Your order for ${order.foodName} has been placed successfully!`,
        {
          tag: `order-${order._id}`,
          data: { orderId: order._id, type: "new_order" }
        }
      ).catch(err => console.error("Push notification error:", err));
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
      if (!order.userEmail || !order.foodName || !order.quantity || !order.price) {
        return res.status(400).json({
          success: false,
          message: "Each order must have userEmail, foodName, quantity, and price",
        });
      }
      
      // Set default tableNumber to 0 if not provided
      if (order.tableNumber === undefined || order.tableNumber === null) {
        order.tableNumber = 0;
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

    // ✅ Invalidate orders cache
    await invalidateCache(CACHE_KEYS.ORDERS);

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

        // 📱 Send push notification to user about status change
        if (order.userEmail) {
          const statusMessages = {
            Pending: "⏳ Your order is pending",
            Cooking: "👨‍🍳 Your order is being cooked",
            Ready: "✅ Your order is ready!",
            Served: "🍽️ Your order has been served",
            Completed: "🎉 Your order is completed!"
          };
          
          sendPushToUser(
            order.userEmail,
            statusMessages[order.status] || "Order Status Updated",
            `${order.foodName} - Status: ${order.status}`,
            {
              tag: `order-${order._id}`,
              data: { orderId: order._id, status: order.status, type: "status_change" }
            }
          ).catch(err => console.error("Push notification error:", err));
        }
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

// ❌ Delete order (User can only delete completed, Admin can delete any)
export const deleteOrder = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for deleteOrder...");
      await connectDB();
    }

    const { id } = req.params;
    // Check if this is an admin request (from query param or header)
    const isAdmin = req.query.admin === 'true' || req.headers['x-admin-request'] === 'true';

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // If not admin, only allow delete if status is "Completed"
    if (!isAdmin && order.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "You can only delete completed orders",
      });
    }

    // Admin can delete any order, regular users can only delete completed orders
    await Order.findByIdAndDelete(id);

    // ✅ Invalidate orders cache
    await invalidateCache(CACHE_KEYS.ORDERS);

    // ✅ Emit delete event for real-time sync (to all admins and clients)
    const io = req.app.get("io");
    if (io) {
      // Emit to admins room for faster delivery
      if (typeof io.to === "function") {
        io.to("admins").emit("orderDeleted", id);
        // Also broadcast to all clients for real-time updates
        io.emit("orderDeleted", id);
      } else if (typeof io.emit === "function") {
        // Fallback for non-room-based setup
        io.emit("orderDeleted", id);
      }
      console.log("🗑️ Emitted orderDeleted event for order:", id, isAdmin ? "(Admin delete)" : "(User delete)");
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
// 🔒 Get Occupied Tables
export const getOccupiedTables = async (req, res) => {
  try {
    // Find all active orders (not completed or served)
    // Note: You might want to include "Served" if they are still occupying the table
    // For now, assuming "Completed" means they left.
    const activeOrders = await Order.find({
      status: { $ne: "Completed" },
      isInRestaurant: true
    });

    const occupied = {};

    activeOrders.forEach(order => {
      // Handle multiple tables format
      if (order.tables && order.tables.length > 0) {
        order.tables.forEach(t => {
          if (!occupied[t.tableNumber]) {
            occupied[t.tableNumber] = [];
          }
          // Add unique chair indices
          if (t.chairIndices && Array.isArray(t.chairIndices)) {
             t.chairIndices.forEach(idx => {
               if (!occupied[t.tableNumber].includes(idx)) {
                 occupied[t.tableNumber].push(idx);
               }
             });
          }
        });
      } 
      // Handle legacy single table format
      else if (order.tableNumber) {
        if (!occupied[order.tableNumber]) {
          occupied[order.tableNumber] = [];
        }
        if (order.chairIndices && Array.isArray(order.chairIndices)) {
          order.chairIndices.forEach(idx => {
            if (!occupied[order.tableNumber].includes(idx)) {
              occupied[order.tableNumber].push(idx);
            }
          });
        }
      }
    });

    res.status(200).json(occupied);
  } catch (error) {
    console.error("Error fetching occupied tables:", error);
    res.status(500).json({ message: "Failed to fetch occupied tables" });
  }
};
