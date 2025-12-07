import { container } from '../config/container.js';

/**
 * Order Controller (Refactored with SOLID)
 * THIN CONTROLLER - Only handles HTTP concerns
 * Business logic delegated to OrderService
 * Follows SRP, DIP principles
 * 
 * Before: 526 lines with mixed concerns
 * After: ~150 lines, focused on HTTP handling
 */

// 📦 Get all orders
export const getOrders = async (req, res, next) => {
  try {
    const orderService = container.resolve('orderService');
    const cacheService = container.resolve('cacheService');

    // Try cache first
    const cachedOrders = await cacheService.get('orders');
    if (cachedOrders) {
      console.log('✅ Serving orders from cache');
      return res.status(200).json(cachedOrders);
    }

    // Get from database
    const orders = await orderService.getAll({}, { sort: { createdAt: -1 } });
    
    // Cache the result
    await cacheService.set('orders', orders, 60);
    
    console.log(`✅ Fetched ${orders.length} orders`);
    res.status(200).json(orders);
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};

// ➕ Create single order
export const createOrder = async (req, res, next) => {
  try {
    const orderService = container.resolve('orderService');

    // Set default table number if not provided
    if (req.body.tableNumber === undefined) {
      req.body.tableNumber = 0;
    }

    const order = await orderService.createOrder(req.body);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

// ➕ Create multiple orders
export const createMultipleOrders = async (req, res, next) => {
  try {
    const orderService = container.resolve('orderService');

    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order data. Expected array of orders.'
      });
    }

    // Set default table numbers
    req.body.forEach(order => {
      if (order.tableNumber === undefined) {
        order.tableNumber = 0;
      }
    });

    const orders = await orderService.createMultipleOrders(req.body);

    res.status(201).json({
      success: true,
      message: 'Multiple orders created successfully',
      orders
    });
  } catch (error) {
    next(error);
  }
};

// 🔄 Update order status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const orderService = container.resolve('orderService');
    const { id } = req.params;

    const order = await orderService.updateOrderStatus(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

// ❌ Delete order
export const deleteOrder = async (req, res, next) => {
  try {
    const orderService = container.resolve('orderService');
    const orderRepository = container.resolve('orderRepository');
    const { id } = req.params;
    
    // Check if admin request
    const isAdmin = req.query.admin === 'true' || req.headers['x-admin-request'] === 'true';

    // Check order exists and permissions
    const order = await orderRepository.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Non-admins can only delete completed orders
    if (!isAdmin && order.status !== 'Completed') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete completed orders'
      });
    }

    await orderService.deleteOrder(id);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      deletedOrderId: id
    });
  } catch (error) {
    next(error);
  }
};

// 🔒 Get occupied tables
export const getOccupiedTables = async (req, res, next) => {
  try {
    const orderService = container.resolve('orderService');
    
    const occupiedData = await orderService.getOccupiedTables();
    
    // Format result: { tableNumber: [uniqueChairIndices] }
    const occupied = {};
    
    occupiedData.forEach(item => {
      if (item._id !== null && item._id !== undefined) {
        // Flatten and deduplicate chairs
        const flatChairs = item.allChairs.flat().filter(c => c !== null && c !== undefined);
        occupied[item._id] = [...new Set(flatChairs)].sort((a, b) => a - b);
      }
    });

    res.status(200).json(occupied);
  } catch (error) {
    next(error);
  }
};
