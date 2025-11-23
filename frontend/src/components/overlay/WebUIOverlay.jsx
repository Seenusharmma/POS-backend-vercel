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
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 sm:bottom-24 md:bottom-28 left-4 sm:left-6 md:left-8 z-40 cursor-pointer group"
      onClick={handleClick}
      title="Visit WebUI.in"
    >
      <div className="relative">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
        
        {/* Icon container */}
        <div className="relative bg-white rounded-full p-3 sm:p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-blue-100 group-hover:border-blue-300">
          <img
            src="/webui.svg"
            alt="WebUI"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:rotate-12"
          />
        </div>
        
        {/* Tooltip - positioned to the right since button is on left */}
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

