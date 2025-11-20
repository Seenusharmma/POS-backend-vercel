import React from "react";
import TypeFilter from "./TypeFilter";
import CategoryFilter from "./CategoryFilter";

const Filters = ({
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  categories
}) => {
  return (
    <div className="flex flex-col gap-5 py-8 px-4 sm:px-10 bg-white shadow-sm sticky top-0 z-10">
      <TypeFilter typeFilter={typeFilter} setTypeFilter={setTypeFilter} />

      <CategoryFilter
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
      />
    </div>
  );
};

export default Filters;
