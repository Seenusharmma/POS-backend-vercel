import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

// Get user's cart
router.get("/", getCart);

// Add item to cart
router.post("/add", addToCart);

// Update item quantity in cart
router.put("/update", updateCartItem);

// Remove item from cart
router.delete("/remove", removeFromCart);

// Clear entire cart
router.delete("/clear", clearCart);

export default router;

