import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import foodFilterReducer from './slices/foodFilterSlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import foodsReducer from './slices/foodsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    foodFilter: foodFilterReducer,
    cart: cartReducer,
    orders: ordersReducer,
    foods: foodsReducer,
  },
});

