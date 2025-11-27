import React from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaSignOutAlt, FaShoppingBag, FaHistory } from "react-icons/fa";
import toast from "react-hot-toast";


const Profile = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-50 to-white px-4 pb-20 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Not Logged In</h2>
          <p className="text-gray-600 mb-6">Please login to view your profile</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 pb-20 md:pb-8 mt-10">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 sm:border-4 border-yellow-400 shadow-md object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-md flex-shrink-0">
                {user.email?.[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Profile</h2>
              <p className="text-gray-600 text-xs sm:text-sm truncate">{user.displayName || "User"}</p>
            </div>
          </div>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <FaUser className="text-red-600 text-base sm:text-lg" />
            Account Information
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
              <FaEnvelope className="text-gray-500 flex-shrink-0 text-sm sm:text-base" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{user.email}</p>
              </div>
            </div>
            {user.displayName && (
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <FaUser className="text-gray-500 flex-shrink-0 text-sm sm:text-base" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Display Name</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{user.displayName}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Quick Actions</h3>
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={() => navigate("/order")}
              className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 hover:bg-red-100 rounded-lg transition text-left"
            >
              <FaShoppingBag className="text-red-600 text-lg sm:text-xl flex-shrink-0" />
              <span className="font-semibold text-gray-800 text-sm sm:text-base">My Orders</span>
            </button>
            <button
              onClick={() => navigate("/history")}
              className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-left"
            >
              <FaHistory className="text-blue-600 text-lg sm:text-xl flex-shrink-0" />
              <span className="font-semibold text-gray-800 text-sm sm:text-base">Order History</span>
            </button>
          </div>
        </motion.div>



        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition text-sm sm:text-base"
        >
          <FaSignOutAlt />
          Logout
        </motion.button>
      </div>
    </div>
  );
};

export default Profile;

