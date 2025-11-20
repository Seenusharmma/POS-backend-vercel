import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  foods: [],
  loading: false,
  error: null,
};

const foodsSlice = createSlice({
  name: 'foods',
  initialState,
  reducers: {
    setFoods: (state, action) => {
      state.foods = action.payload;
      state.loading = false;
      state.error = null;
    },
    addFood: (state, action) => {
      state.foods.push(action.payload);
    },
    updateFood: (state, action) => {
      const index = state.foods.findIndex(
        (food) => food._id === action.payload._id
      );
      if (index !== -1) {
        state.foods[index] = action.payload;
      }
    },
    removeFood: (state, action) => {
      state.foods = state.foods.filter((food) => food._id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setFoods,
  addFood,
  updateFood,
  removeFood,
  setLoading,
  setError,
} = foodsSlice.actions;

export default foodsSlice.reducer;

