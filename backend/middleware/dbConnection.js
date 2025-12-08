import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

/**
 * Database Connection Middleware
 * Ensures database is connected before processing requests
 * Extracted for SRP
 */
export const ensureDBConnection = async (req, res, next) => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    // Attempt connection with retries
    let retries = 0;
    const maxRetries = 3;

    while (mongoose.connection.readyState !== 1 && retries < maxRetries) {
      console.log(`🔄 Establishing database connection... (Attempt ${retries + 1}/${maxRetries})`);
      
      await connectDB();
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for connection
      
      if (mongoose.connection.readyState === 1) {
        console.log('✅ Database connection established');
        return next();
      }
      
      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // Connection failed after retries
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again later.'
    });

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Database connection failed'
    });
  }
};
