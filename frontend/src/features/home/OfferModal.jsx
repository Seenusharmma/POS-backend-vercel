import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaPhoneAlt, FaPercentage } from "react-icons/fa";

const OfferModal = ({ offer, isOpen, onClose }) => {
  if (!offer) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-100 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Image Section with Close Button */}
              <div className="relative h-48 sm:h-64 overflow-hidden">
                <img
                  src={offer.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80"}
                  alt={offer.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm rounded-full transition-all duration-200"
                >
                  <FaTimes size={20} />
                </button>

                {/* Offer Badge */}
                <div className="absolute bottom-4 left-6 flex items-center gap-2">
                  <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <FaPercentage size={12} />
                    SPECIAL OFFER
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 sm:p-8 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                    {offer.title}
                  </h2>
                  <div className="h-1 w-16 bg-orange-500 rounded-full"></div>
                </div>

                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  {offer.description}
                </p>

                {offer.validUntil && (
                  <p className="text-xs font-medium text-orange-600 bg-orange-50 inline-block px-3 py-1 rounded-md">
                    Valid until: {new Date(offer.validUntil).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <a
                    href="tel:+917008278701"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all active:scale-95"
                  >
                    <FaPhoneAlt size={18} />
                    Call to Order
                  </a>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-4 rounded-2xl font-bold transition-all active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Decorative side element */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 rounded-full blur-2xl opacity-20"></div>
              <div className="absolute -right-4 top-1/4 w-12 h-12 bg-yellow-400 rounded-full blur-2xl opacity-10"></div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OfferModal;
