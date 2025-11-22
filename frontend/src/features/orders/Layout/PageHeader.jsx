import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const PageHeader = () => {
  return (
    <motion.h1
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center mb-10"
    >
      🛒 Your Cart
    </motion.h1>
  );
};

export default PageHeader;
