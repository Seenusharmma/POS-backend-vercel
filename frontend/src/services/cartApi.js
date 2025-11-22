import axios from "axios";
import API_BASE from "./api.js";
import toast from "react-hot-toast";

// Get user's cart from backend
export const fetchCart = async (userEmail) => {
  try {
    const response = await axios.get(`${API_BASE}/api/cart`, {
      params: { userEmail },
    });
    return response.data.cart || [];
  } catch (error) {
    console.error("Error fetching cart:", error);
    // Return empty array if cart doesn't exist yet (first time user)
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

// Add item to cart in backend
export const addItemToCart = async (userData, foodItem, quantity = 1) => {
  try {
    const response = await axios.post(`${API_BASE}/api/cart/add`, {
      userEmail: userData.email,
      userId: userData.uid,
      userName: userData.displayName || "Guest User",
      foodId: foodItem._id,
      foodName: foodItem.name || foodItem.foodName,
      category: foodItem.category || "Uncategorized",
      type: foodItem.type || "Veg",
      quantity,
      price: foodItem.price,
      image: foodItem.image || "",
    });
    return response.data.cart || [];
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

// Update item quantity in backend cart
export const updateCartItemQuantity = async (userEmail, foodId, quantity) => {
  try {
    const response = await axios.put(`${API_BASE}/api/cart/update`, {
      userEmail,
      foodId,
      quantity,
    });
    return response.data.cart || [];
  } catch (error) {
    console.error("Error updating cart:", error);
    throw error;
  }
};

// Remove item from backend cart
export const removeItemFromCart = async (userEmail, foodId) => {
  try {
    const response = await axios.delete(`${API_BASE}/api/cart/remove`, {
      data: { userEmail, foodId },
    });
    return response.data.cart || [];
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
};

// Clear entire cart in backend
export const clearUserCart = async (userEmail) => {
  try {
    const response = await axios.delete(`${API_BASE}/api/cart/clear`, {
      data: { userEmail },
    });
    return [];
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};

