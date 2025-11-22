import Cart from "../models/cartModel.js";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

// 📦 Get user's cart
export const getCart = async (req, res) => {
  try {
    // Ensure database connection (for serverless)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for getCart...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false,
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ 
        success: false, 
        message: "User email is required" 
      });
    }

    let cart = await Cart.findOne({ userEmail });

    // If cart doesn't exist, create an empty one
    if (!cart) {
      cart = new Cart({
        userEmail,
        items: [],
      });
      await cart.save();
    }

    res.status(200).json({ 
      success: true, 
      cart: cart.items || [] 
    });
  } catch (error) {
    console.error("❌ Error fetching cart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ➕ Add item to cart
export const addToCart = async (req, res) => {
  try {
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for addToCart...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false,
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const { 
      userEmail, 
      userId, 
      userName,
      foodId,
      foodName,
      category,
      type,
      quantity,
      price,
      image 
    } = req.body;

    if (!userEmail || !foodId || !foodName || price === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userEmail });
    
    if (!cart) {
      cart = new Cart({
        userEmail,
        userId: userId || "",
        userName: userName || "Guest User",
        items: [],
      });
    } else {
      // Update user info if provided
      if (userId) cart.userId = userId;
      if (userName) cart.userName = userName;
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.foodId === foodId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity || 1;
    } else {
      // Add new item to cart
      cart.items.push({
        foodId,
        foodName,
        category: category || "Uncategorized",
        type: type || "Veg",
        quantity: quantity || 1,
        price,
        image: image || "",
      });
    }

    await cart.save();

    res.status(200).json({ 
      success: true, 
      message: "Item added to cart",
      cart: cart.items 
    });
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to add item to cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// 🔄 Update item quantity in cart
export const updateCartItem = async (req, res) => {
  try {
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for updateCartItem...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false,
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const { userEmail, foodId, quantity } = req.body;

    if (!userEmail || !foodId || quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    const cart = await Cart.findOne({ userEmail });

    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart not found" 
      });
    }

    const itemIndex = cart.items.findIndex((item) => item.foodId === foodId);

    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Item not found in cart" 
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    res.status(200).json({ 
      success: true, 
      message: "Cart updated",
      cart: cart.items 
    });
  } catch (error) {
    console.error("❌ Error updating cart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ➖ Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for removeFromCart...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false,
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const { userEmail, foodId } = req.body;

    if (!userEmail || !foodId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    const cart = await Cart.findOne({ userEmail });

    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart not found" 
      });
    }

    cart.items = cart.items.filter((item) => item.foodId !== foodId);
    await cart.save();

    res.status(200).json({ 
      success: true, 
      message: "Item removed from cart",
      cart: cart.items 
    });
  } catch (error) {
    console.error("❌ Error removing from cart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to remove item from cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// 🗑️ Clear entire cart
export const clearCart = async (req, res) => {
  try {
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 Establishing database connection for clearCart...");
      await connectDB();
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false,
          message: "Database connection unavailable. Please try again later." 
        });
      }
    }

    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ 
        success: false, 
        message: "User email is required" 
      });
    }

    const cart = await Cart.findOne({ userEmail });

    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart not found" 
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ 
      success: true, 
      message: "Cart cleared",
      cart: [] 
    });
  } catch (error) {
    console.error("❌ Error clearing cart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to clear cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

