/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useCallback } from "react";

export const FoodFilterContext = createContext();

export const FoodFilterProvider = ({ children }) => {
  const [foodFilter, setFoodFilter] = useState(null); // null (all), "Veg", "Non-Veg"

  const toggleFilter = () => {
    setFoodFilter((prev) => {
      if (prev === null) return "Veg";
      if (prev === "Veg") return "Non-Veg";
      return null; // Show all
    });
  };

  const filterFoods = useCallback(
    (foods) => {
      if (foodFilter === null) return foods;
      return foods.filter((food) => food.type === foodFilter);
    },
    [foodFilter]
  );

  return (
    <FoodFilterContext.Provider
      value={{ foodFilter, toggleFilter, filterFoods }}
    >
      {children}
    </FoodFilterContext.Provider>
  );
};

export const useFoodFilter = () => {
  const context = useContext(FoodFilterContext);
  if (!context) {
    throw new Error("useFoodFilter must be used within FoodFilterProvider");
  }
  return context;
};

