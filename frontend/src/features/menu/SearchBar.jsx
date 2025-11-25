import React, { useState, useMemo } from "react";
import { IoSearch } from "react-icons/io5";
import Fuse from "fuse.js";

const SearchBar = ({ searchQuery, setSearchQuery, foods }) => {
  const [suggestions, setSuggestions] = useState([]);

  // Initialize Fuse.js with optimized configuration
  const fuse = useMemo(() => {
    if (!foods || foods.length === 0) return null;
    
    return new Fuse(foods, {
      keys: [
        { name: "name", weight: 0.7 }, // Name is most important
        { name: "category", weight: 0.2 }, // Category is secondary
        { name: "type", weight: 0.1 }, // Type is least important
      ],
      threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true, // Search anywhere in the string
      findAllMatches: true,
    });
  }, [foods]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    if (!fuse) {
      setSuggestions([]);
      return;
    }

    // Use Fuse.js for fuzzy search
    const results = fuse.search(query, { limit: 5 });
    const matched = results.map((result) => result.item);
    setSuggestions(matched);
  };

  return (
    <div className="relative w-11/12 sm:w-2/3 md:w-1/2 mx-auto mt-6">
      <div className="flex items-center bg-white shadow-xl rounded-full px-4 py-2 border border-gray-200">
        <IoSearch className="text-gray-500 text-xl mr-2" />
        <input
          type="text"
          placeholder="Search for food, dishes or cuisines..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 p-2 outline-none text-gray-700 text-base bg-transparent"
        />
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute w-full bg-white border border-gray-200 rounded-lg mt-2 shadow-xl z-20 max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <li
              key={s._id}
              onClick={() => {
                setSearchQuery(s.name);
                setSuggestions([]);
              }}
              className="px-4 py-2 hover:bg-red-50 cursor-pointer text-gray-700"
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
