import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoSearch, IoClose } from "react-icons/io5";
import { FaClock, FaFire, FaUtensils } from "react-icons/fa";
import Fuse from "fuse.js";
import { useDebounce } from "../../hooks/useDebounce";

const MAX_SEARCH_HISTORY = 5;
const MAX_SUGGESTIONS = 8;

const EnhancedSearchBar = ({ 
  searchQuery, 
  setSearchQuery, 
  foods, 
  onSearch,
  placeholder = "Search for food, dishes or cuisines..."
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error loading search history:", e);
      }
    }
  }, []);

  // Calculate popular searches based on food names (most common)
  useEffect(() => {
    if (foods && foods.length > 0) {
      // Get unique food names and create popular searches
      const foodNames = [...new Set(foods.map(f => f.name))];
      // Take first 6 as popular searches
      setPopularSearches(foodNames.slice(0, 6));
    }
  }, [foods]);

  // Initialize Fuse.js for fuzzy search - Optimized for speed
  const fuse = useMemo(() => {
    if (!foods || foods.length === 0) return null;
    
    return new Fuse(foods, {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "category", weight: 0.2 },
        { name: "type", weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
      findAllMatches: false, // Performance optimization
      useExtendedSearch: false, // Disable for speed
      shouldSort: true,
    });
  }, [foods]);

  // Debounce search query for suggestions (100ms for instant feel)
  const debouncedQuery = useDebounce(searchQuery, 100);

  // Handle search suggestions with debouncing
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }

    if (!fuse) {
      setSuggestions([]);
      return;
    }

    // Get search suggestions with limit for performance
    const results = fuse.search(debouncedQuery, { limit: MAX_SUGGESTIONS });
    const matched = results.map((result) => ({
      ...result.item,
      score: result.score,
    }));
    setSuggestions(matched);
  }, [debouncedQuery, fuse]);

  // Handle search input change - Immediate UI update
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query); // Update immediately for responsive UI

    // Clear suggestions immediately if query is empty
    if (!query.trim()) {
      setSuggestions([]);
    }
  }, []);

  // Handle search when user presses Enter or clicks search
  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery);
    }
  }, [searchQuery, onSearch]);

  // Save to search history
  const saveToHistory = (query) => {
    if (!query.trim()) return;
    
    const newHistory = [
      query,
      ...searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase())
    ].slice(0, MAX_SEARCH_HISTORY);
    
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  // Handle suggestion click
  const handleSuggestionClick = (foodName) => {
    setSearchQuery(foodName);
    saveToHistory(foodName);
    setIsFocused(false);
    if (onSearch) {
      onSearch(foodName);
    }
  };

  // Handle popular search click
  const handlePopularSearchClick = (searchTerm) => {
    setSearchQuery(searchTerm);
    saveToHistory(searchTerm);
    setIsFocused(false);
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  // Handle history item click
  const handleHistoryClick = (historyItem) => {
    setSearchQuery(historyItem);
    setIsFocused(false);
    if (onSearch) {
      onSearch(historyItem);
    }
  };

  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // Clear single history item
  const removeHistoryItem = (item, e) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const showDropdown = isFocused && (suggestions.length > 0 || searchHistory.length > 0 || popularSearches.length > 0 || searchQuery.trim());

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div
          className={`flex items-center bg-white rounded-full px-4 py-3 shadow-lg border-2 transition-all duration-300 ${
            isFocused
              ? "border-orange-500 shadow-orange-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <IoSearch className="text-gray-400 text-xl mr-3 flex-shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={placeholder}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setIsFocused(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchSubmit();
                          setIsFocused(false);
                        }
                      }}
                      className="flex-1 outline-none text-gray-800 text-base bg-transparent placeholder:text-gray-400"
                    />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
              }}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IoClose className="text-xl" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-y-auto"
          >
            {/* Search Suggestions */}
            {searchQuery.trim() && suggestions.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <IoSearch className="text-gray-400 text-sm" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Suggestions
                  </span>
                </div>
                {suggestions.map((food) => (
                  <motion.div
                    key={food._id}
                    whileHover={{ backgroundColor: "#fff7ed" }}
                    onClick={() => handleSuggestionClick(food.name)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group"
                  >
                    <FaUtensils className="text-gray-400 group-hover:text-orange-500 text-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {food.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {food.category} • {food.type}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">₹{food.price || 0}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Results Message */}
            {searchQuery.trim() && suggestions.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-gray-500 text-sm">
                  No results found for "{searchQuery}"
                </p>
              </div>
            )}

            {/* Search History */}
            {!searchQuery.trim() && searchHistory.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-gray-400 text-sm" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Recent Searches
                    </span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
                {searchHistory.map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ backgroundColor: "#fff7ed" }}
                    onClick={() => handleHistoryClick(item)}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FaClock className="text-gray-400 text-sm flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{item}</span>
                    </div>
                    <button
                      onClick={(e) => removeHistoryItem(item, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                    >
                      <IoClose className="text-sm" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {!searchQuery.trim() && popularSearches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <FaFire className="text-orange-500 text-sm" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Popular Searches
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((search, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePopularSearchClick(search)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-600 rounded-full text-sm font-medium transition-colors"
                    >
                      {search}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSearchBar;

