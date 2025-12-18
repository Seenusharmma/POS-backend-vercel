import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaCheckCircle, FaClock, FaFire, FaUtensils, FaTrash } from 'react-icons/fa';

const MobileStatusNotification = ({ notification, onClear }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClear();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClear]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <FaCheckCircle className="text-green-500" />;
      case 'preparing': return <FaFire className="text-orange-500" />;
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'served': return <FaUtensils className="text-blue-500" />;
      case 'deleted': return <FaTrash className="text-red-500" />;
      default: return <FaBell className="text-orange-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-50/95 border-green-200';
      case 'preparing': return 'bg-orange-50/95 border-orange-200';
      case 'pending': return 'bg-yellow-50/95 border-yellow-200';
      case 'served': return 'bg-blue-50/95 border-blue-200';
      case 'deleted': return 'bg-red-50/95 border-red-200';
      default: return 'bg-white/95 border-orange-200';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -120, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -120, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed top-20 left-4 right-4 z-[9999] md:hidden"
      >
        <div className={`backdrop-blur-md border shadow-2xl rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden ${getBgColor()}`}>
          {/* Progress bar at bottom */}
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className={`absolute bottom-0 left-0 h-1 ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'preparing' ? 'bg-orange-500' :
              notification.type === 'served' ? 'bg-blue-500' :
              notification.type === 'deleted' ? 'bg-red-500' : 'bg-orange-400'
            }`}
          />
          
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="text-xl">
              {getIcon()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-sm leading-tight">{notification.title}</h4>
            <p className="text-[11px] text-gray-600 font-medium mt-0.5 line-clamp-1 truncate">
              {notification.message}
            </p>
          </div>
          
          <button 
            onClick={onClear}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileStatusNotification;
