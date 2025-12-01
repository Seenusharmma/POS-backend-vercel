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
    // Ensure foodId is a string
    const foodId = foodItem._id ? String(foodItem._id) : foodItem.id;
    
    if (!foodId) {
      throw new Error("Food ID is missing");
    }

    // Determine the price
    let itemPrice = 0;
    const hasSizes = foodItem.hasSizes === true || foodItem.hasSizes === "true";
    
    // Check if food has sizes - if so, require size selection
    if (hasSizes) {
      if (!foodItem.selectedSize) {
        console.error("❌ Size selection required but not provided");
        throw new Error("Please select a size for this item before adding to cart.");
      }
      
      // Priority 1: Use the price that was explicitly set from size selection modal
      // This is the most reliable source as it's set directly from the modal
      const explicitPrice = foodItem.price;
      if (explicitPrice !== undefined && explicitPrice !== null && explicitPrice !== "" && Number(explicitPrice) > 0) {
        itemPrice = Number(explicitPrice);
      }
      // Priority 2: Get price from sizes object (for standard sizes) or halfFull (for half-full sizes)
      else {
        const sizeType = foodItem.sizeType || "standard";
        let sizePrice = null;
        
        if (sizeType === "half-full") {
          // Get price from halfFull object
          sizePrice = foodItem.halfFull && foodItem.halfFull[foodItem.selectedSize];
        } else {
          // Get price from sizes object (Small/Medium/Large)
          sizePrice = foodItem.sizes && foodItem.sizes[foodItem.selectedSize];
        }
        
        if (sizePrice !== null && sizePrice !== undefined && Number(sizePrice) > 0) {
          itemPrice = Number(sizePrice);
        } else {
          console.error("❌ Size price is invalid:", sizePrice);
          throw new Error(`Invalid price for ${foodItem.selectedSize} size. Please try again.`);
        }
      }
    } else {
      // For foods without sizes, use the base price
      const basePrice = foodItem.price;
      if (basePrice !== undefined && basePrice !== null && basePrice !== "") {
        itemPrice = Number(basePrice);
        if (itemPrice <= 0 || isNaN(itemPrice)) {
          console.error("❌ Invalid base price:", basePrice);
          throw new Error("Invalid price for this item. Please contact support.");
        }
      } else {
        console.error("❌ No price found for food without sizes");
        throw new Error("Price not available for this item. Please contact support.");
      }
    }

    // Final validation
    if (!itemPrice || itemPrice <= 0 || isNaN(itemPrice)) {
      console.error("❌ Invalid price after calculation:", {
        foodName: foodItem.name,
        price: foodItem.price,
        hasSizes: foodItem.hasSizes,
        selectedSize: foodItem.selectedSize,
        sizes: foodItem.sizes,
        calculatedPrice: itemPrice,
      });
      throw new Error(`Invalid price: ${itemPrice}. Please select a size if this item has size options.`);
    }

    const payload = {
      userEmail: userData.email,
      userId: userData.uid,
      userName: userData.displayName || "Guest User",
      foodId: foodId,
      foodName: foodItem.name || foodItem.foodName,
      category: foodItem.category || "Uncategorized",
      type: foodItem.type || "Veg",
      quantity: quantity || 1,
      price: itemPrice,
      image: foodItem.image || "",
    };

    // Only include selectedSize if it's a valid value
    if (foodItem.selectedSize && ["Small", "Medium", "Large"].includes(foodItem.selectedSize)) {
      payload.selectedSize = foodItem.selectedSize;
    }

    const response = await axios.post(`${API_BASE}/api/cart/add`, payload);
    return response.data.cart || [];
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    console.error("Error response:", error.response?.data);
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

