import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";

const UsernameModal = ({ isOpen, onClose, user }) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      toast.error("Please enter a username");
      return;
    }

    if (trimmedUsername.length < 2) {
      toast.error("Username must be at least 2 characters");
      return;
    }

    if (trimmedUsername.length > 20) {
      toast.error("Username must be less than 20 characters");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: trimmedUsername,
      });
      toast.success(`Welcome, ${trimmedUsername}! 🎉`);
      // Small delay to ensure profile update propagates
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to save username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow user to skip, but they'll be asked again next time if still no username
    onClose();
  };

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👤</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  Welcome! 👋
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Please enter your username to continue
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-base"
                    autoFocus
                    disabled={loading}
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {username.length}/20 characters
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSkip}
                    disabled={loading}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Skip
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    disabled={loading || !username.trim()}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Continue"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UsernameModal;

