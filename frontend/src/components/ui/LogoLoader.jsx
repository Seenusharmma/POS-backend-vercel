import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const LogoLoader = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-red-50 via-yellow-50 to-white z-50">
      <motion.img
        src="/logo.png"
        alt="Loading..."
        className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.2, 1], opacity: 1, rotate: [0, 360, 0] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      
    </div>
  );
};

export default LogoLoader;
