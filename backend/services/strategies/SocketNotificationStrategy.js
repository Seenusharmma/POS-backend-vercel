/**
 * Socket Notification Strategy
 * Sends real-time updates via Socket.IO
 */
export class SocketNotificationStrategy {
  constructor(io) {
    this.io = io;
  }

  async handleNewOrder(order) {
    if (!this.io || typeof this.io.to !== 'function') {
      return; // Socket not available
    }

    try {
      // Notify admins
      this.io.to('admins').emit('newOrderPlaced', order);
      
      // Notify specific user
      if (order.userId) {
        this.io.to(`user:${order.userId}`).emit('newOrderPlaced', order);
      }
      
      console.log('📦 Socket: New order notification sent');
    } catch (error) {
      console.error('Socket notification error:', error.message);
    }
  }

  async handleStatusChange(order) {
    if (!this.io || typeof this.io.to !== 'function') {
      return;
    }

    try {
      // Notify admins
      this.io.to('admins').emit('orderStatusChanged', order);
      
      // Notify specific user
      if (order.userId) {
        this.io.to(`user:${order.userId}`).emit('orderStatusChanged', order);
      }
      
      // Also broadcast to all users (they filter by email)
      this.io.to('users').emit('orderStatusChanged', order);
      
      console.log(`🔄 Socket: Status change notification sent for order ${order._id}`);
    } catch (error) {
      console.error('Socket notification error:', error.message);
    }
  }

  async handlePaymentSuccess(order) {
    if (!this.io || typeof this.io.to !== 'function') {
      return;
    }

    try {
      this.io.to('admins').emit('paymentSuccess', order);
      
      if (order.userId) {
        this.io.to(`user:${order.userId}`).emit('paymentSuccess', order);
      }
      
      this.io.to('users').emit('paymentSuccess', order);
      
      console.log(`💰 Socket: Payment success notification sent for order ${order._id}`);
    } catch (error) {
      console.error('Socket notification error:', error.message);
    }
  }

  async handleOrderDeleted(orderId) {
    if (!this.io || typeof this.io.emit !== 'function') {
      return;
    }

    try {
      this.io.emit('orderDeleted', orderId);
      console.log(`🗑️ Socket: Order deleted notification sent for ${orderId}`);
    } catch (error) {
      console.error('Socket notification error:', error.message);
    }
  }
}
