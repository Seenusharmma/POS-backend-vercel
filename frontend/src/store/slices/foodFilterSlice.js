import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  foodFilter: null, // null (all), "Veg", "Non-Veg"
};

const foodFilterSlice = createSlice({
  name: 'foodFilter',
  initialState,
  reducers: {
    toggleFilter: (state) => {
      if (state.foodFilter === null) {
        state.foodFilter = 'Veg';
      } else if (state.foodFilter === 'Veg') {
        state.foodFilter = 'Non-Veg';
      } else {
        state.foodFilter = null; // Show all
      }
    },
    setFilter: (state, action) => {
      state.foodFilter = action.payload;
    },
    clearFilter: (state) => {
      state.foodFilter = null;
    },
  },
});

export const { toggleFilter, setFilter, clearFilter } = foodFilterSlice.actions;

// Selector for filtered foods
export const selectFilteredFoods = (foods, filter) => {
  if (filter === null) return foods;
  return foods.filter((food) => food.type === filter);
};

export default foodFilterSlice.reducer;

