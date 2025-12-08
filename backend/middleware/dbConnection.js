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

    // Single connection attempt with timeout suitable for cold starts
    console.log('🔄 Establishing database connection...');
    
    const startTime = Date.now();
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Increased for cold starts
    
    const connectionTime = Date.now() - startTime;
    
    if (mongoose.connection.readyState === 1) {
      console.log(`✅ Database connection established in ${connectionTime}ms`);
      return next();
    }

    // Connection failed - fast-fail for serverless
    console.error(`❌ Connection failed after ${connectionTime}ms. ReadyState: ${mongoose.connection.readyState}`);
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
