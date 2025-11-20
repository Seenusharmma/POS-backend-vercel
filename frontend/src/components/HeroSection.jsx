import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SearchBar from "./SearchBar";

const HeroSection = ({ searchQuery, setSearchQuery, foods }) => {
  return (
    <section className="relative bg-gradient-to-r from-[#ffecd2] to-[#fcb69f] py-16 sm:py-20 shadow-md text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl sm:text-5xl font-extrabold text-gray-800"
      >
        Delicious Food, Delivered Fast 🚀
      </motion.h1>

      <p className="text-gray-600 mt-3 text-base sm:text-lg">
        Discover top-rated dishes near you from Food Fantasy 🍱
      </p>

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        foods={foods}
      />
    </section>
  );
};

export default HeroSection;
