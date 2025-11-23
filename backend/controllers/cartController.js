import Cart from "../models/cartModel.js";

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ message: "userEmail is required" });
    }

    let cart = await Cart.findOne({ userEmail });

    if (!cart) {
      // Return empty cart if not found
      return res.status(200).json({ cart: [] });
    }

    res.status(200).json({ cart: cart.items || [] });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Failed to fetch cart", error: error.message });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { userEmail, userId, userName, foodId, foodName, category, type, quantity, price, image } = req.body;

    if (!userEmail || !foodId || !foodName || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let cart = await Cart.findOne({ userEmail });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        userEmail,
        userId: userId || "",
        userName: userName || "Guest User",
        items: [],
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.foodId === foodId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity || 1;
    } else {
      // Add new item
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
      message: "Item added to cart successfully",
      cart: cart.items 
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Failed to add item to cart", error: error.message });
  }
};

// Update item quantity in cart
export const updateCartItem = async (req, res) => {
  try {
    const { userEmail, foodId, quantity } = req.body;

    if (!userEmail || !foodId || quantity === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    const cart = await Cart.findOne({ userEmail });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item.foodId === foodId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.status(200).json({ 
      message: "Cart item updated successfully",
      cart: cart.items 
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Failed to update cart", error: error.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    // Support both body (Axios DELETE with data) and query params
    const { userEmail, foodId } = req.body || req.query;

    if (!userEmail || !foodId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const cart = await Cart.findOne({ userEmail });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item.foodId !== foodId);
    await cart.save();

    res.status(200).json({ 
      message: "Item removed from cart successfully",
      cart: cart.items 
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Failed to remove item from cart", error: error.message });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    // Support both body (Axios DELETE with data) and query params
    const { userEmail } = req.body || req.query;

    if (!userEmail) {
      return res.status(400).json({ message: "userEmail is required" });
    }

    const cart = await Cart.findOne({ userEmail });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ 
      message: "Cart cleared successfully",
      cart: [] 
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Failed to clear cart", error: error.message });
  }
};

