import React, { useState } from "react";
import { IoSearch } from "react-icons/io5";

const SearchBar = ({ searchQuery, setSearchQuery, foods }) => {
  const [suggestions, setSuggestions] = useState([]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) return setSuggestions([]);

    const matched = foods
      .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

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
