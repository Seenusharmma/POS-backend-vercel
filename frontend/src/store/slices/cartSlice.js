import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchCart as fetchCartApi,
  addItemToCart as addItemToCartApi,
  updateCartItemQuantity as updateCartItemQuantityApi,
  removeItemFromCart as removeItemFromCartApi,
  clearUserCart as clearUserCartApi,
} from '../../services/cartApi.js';

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

// Async thunks for cart operations
export const loadCart = createAsyncThunk(
  'cart/loadCart',
  async (userEmail, { rejectWithValue }) => {
    try {
      const cartItems = await fetchCartApi(userEmail);
      return cartItems;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load cart');
    }
  }
);

export const addToCartAsync = createAsyncThunk(
  'cart/addToCartAsync',
  async ({ userData, food, quantity = 1 }, { rejectWithValue }) => {
    try {
      const cartItems = await addItemToCartApi(userData, food, quantity);
      return cartItems;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

export const updateQuantityAsync = createAsyncThunk(
  'cart/updateQuantityAsync',
  async ({ userEmail, foodId, quantity }, { rejectWithValue }) => {
    try {
      const cartItems = await updateCartItemQuantityApi(userEmail, foodId, quantity);
      return cartItems;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart');
    }
  }
);

export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCartAsync',
  async ({ userEmail, foodId }, { rejectWithValue }) => {
    try {
      const cartItems = await removeItemFromCartApi(userEmail, foodId);
      return cartItems;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

export const clearCartAsync = createAsyncThunk(
  'cart/clearCartAsync',
  async (userEmail, { rejectWithValue }) => {
    try {
      await clearUserCartApi(userEmail);
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// Transform backend cart items to match frontend format
const transformCartItems = (backendItems) => {
  return backendItems.map((item) => ({
    _id: item.foodId,
    name: item.foodName,
    foodName: item.foodName,
    category: item.category,
    type: item.type,
    quantity: item.quantity,
    price: item.price,
    image: item.image,
  }));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Sync action to update local state (used when backend update succeeds)
    setCartItems: (state, action) => {
      const items = transformCartItems(action.payload);
      state.items = items;
      state.total = calculateTotal(items);
    },
    // Fallback sync action (for offline/local use)
    addToCartLocal: (state, action) => {
      const { food, quantity = 1 } = action.payload;
      const existingItem = state.items.find((item) => item._id === food._id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          ...food,
          quantity,
        });
      }
      state.total = calculateTotal(state.items);
    },
    removeFromCartLocal: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter((item) => item._id !== itemId);
      state.total = calculateTotal(state.items);
    },
    updateQuantityLocal: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find((item) => item._id === itemId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item._id !== itemId);
        } else {
          item.quantity = quantity;
        }
        state.total = calculateTotal(state.items);
      }
    },
    clearCartLocal: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load cart
      .addCase(loadCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCart.fulfilled, (state, action) => {
        state.loading = false;
        const items = transformCartItems(action.payload);
        state.items = items;
        state.total = calculateTotal(items);
      })
      .addCase(loadCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to cart
      .addCase(addToCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        const items = transformCartItems(action.payload);
        state.items = items;
        state.total = calculateTotal(items);
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update quantity
      .addCase(updateQuantityAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuantityAsync.fulfilled, (state, action) => {
        state.loading = false;
        const items = transformCartItems(action.payload);
        state.items = items;
        state.total = calculateTotal(items);
      })
      .addCase(updateQuantityAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove from cart
      .addCase(removeFromCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        const items = transformCartItems(action.payload);
        state.items = items;
        state.total = calculateTotal(items);
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear cart
      .addCase(clearCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.total = 0;
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setCartItems, 
  addToCartLocal, 
  removeFromCartLocal, 
  updateQuantityLocal, 
  clearCartLocal 
} = cartSlice.actions;

export default cartSlice.reducer;

