import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { toggleFilter, setFilter, clearFilter } from './slices/foodFilterSlice';
import { selectFilteredFoods } from './slices/foodFilterSlice';

// Typed hooks for better TypeScript-like experience
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Custom hook for filtered foods
export const useFoodFilter = () => {
  const dispatch = useAppDispatch();
  const foodFilter = useSelector((state) => state.foodFilter.foodFilter);

  const filterFoods = useCallback(
    (foods) => {
      return selectFilteredFoods(foods, foodFilter);
    },
    [foodFilter]
  );

  return {
    foodFilter,
    toggleFilter: () => dispatch(toggleFilter()),
    setFilter: (filter) => dispatch(setFilter(filter)),
    clearFilter: () => dispatch(clearFilter()),
    filterFoods,
  };
};

