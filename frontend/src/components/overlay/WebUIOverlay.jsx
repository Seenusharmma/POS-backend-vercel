import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

/**
 * WebUI Overlay Component
 * Floating button that opens webui.in website when clicked
 * Renders on all pages except admin page
 */
const WebUIOverlay = () => {
  const location = useLocation();
  
  // Don't render on admin page
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  const handleClick = () => {
    // Open webui.in in a new tab
    window.open("https://webui.in", "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15,
        delay: 0.5 
      }}
      whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 sm:bottom-24 left-4 sm:left-6 md:left-8 z-50 cursor-pointer group"
      onClick={handleClick}
      title="Visit WebUI.in"
    >
      <div className="relative">
        {/* Icon container */}
        <div className="relative backdrop-blur-md bg-white/10 rounded-full p-2 sm:p-2.5 shadow-lg hover:bg-blue-50 transition-colors duration-200">
          <img
            src="/webui.svg"
            alt="WebUI"
            className="w-8 h-8 sm:w-7 sm:h-7 md:w-8 md:h-8"
          />
        </div>
        
        {/* Tooltip */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs sm:text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
            Visit WebUI.in
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WebUIOverlay;
