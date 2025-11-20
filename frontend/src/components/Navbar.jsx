import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useFoodFilter } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";
import {
  FaHome,
  FaUtensils,
  FaShoppingBag,
  FaHistory,
  FaCrown,
  FaLeaf,
  FaDrumstickBite,
} from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const { foodFilter, toggleFilter } = useFoodFilter();
  const isLoginPage = location.pathname === "/login";
  
  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const ADMIN_EMAIL = "roshansharma7250@gmail.com";
  const isAdmin = user?.email === ADMIN_EMAIL;

  const menuItems = [
    { name: "Home", icon: <FaHome />, path: "/" },
    { name: "Menu", icon: <FaUtensils />, path: "/menu" },
    { name: "Order", icon: <FaShoppingBag />, path: "/order" },
    { name: "History", icon: <FaHistory />, path: "/history" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg shadow-lg border-b bg-white border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex justify-between items-center h-16">
        {/* 🍴 Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Link
            to="/"
            className="text-orange-500 text-2xl sm:text-3xl font-bold tracking-wide flex items-center gap-2"
          >
            .{" "}
            <span className="text-orange-500 hover:text-orange-600">
              Food Fantasy
            </span>
          </Link>
        </motion.div>

        {/* 🌐 Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center text-gray-700 font-medium">
          {/* 🥗 Swiggy-style Veg/Non-Veg Toggle Switch */}
          {!isLoginPage && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleFilter}
              className={`relative w-10 h-5 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                foodFilter === "Veg"
                  ? "bg-green-500 focus:ring-green-500"
                  : foodFilter === "Non-Veg"
                  ? "bg-red-500 focus:ring-red-500"
                  : "bg-gray-400 focus:ring-gray-400"
              }`}
              title={`Filter: ${foodFilter === "Veg" ? "Veg Only" : foodFilter === "Non-Veg" ? "Non-Veg Only" : "All Items"}`}
            >
              <motion.div
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center"
                animate={{
                  x: foodFilter === "Veg" ? 0 : foodFilter === "Non-Veg" ? 20 : 10,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {foodFilter === "Veg" ? (
                  <FaLeaf className="text-green-600 text-[8px]" />
                ) : foodFilter === "Non-Veg" ? (
                  <FaDrumstickBite className="text-red-600 text-[8px]" />
                ) : (
                  <div className="flex gap-0.5">
                    <FaLeaf className="text-gray-500 text-[6px]" />
                    <FaDrumstickBite className="text-gray-500 text-[6px]" />
                  </div>
                )}
              </motion.div>
            </motion.button>
          )}

          {menuItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className="relative group flex items-center gap-2 hover:text-orange-500 transition-all"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
              <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          ))}

          {/* 👑 Admin button only for admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="relative group flex items-center gap-2 text-orange-600 font-semibold"
            >
              <FaCrown />
              Admin
              <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-orange-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
          )}

          {/* 👤 Logout Button */}
          {user ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="text-white bg-orange-500 font-semibold px-4 py-1 rounded-full hover:bg-orange-600 transition ml-6"
            >
              Logout
            </motion.button>
          ) : (
            <Link
              to="/login"
              className="text-white bg-orange-500 font-semibold px-4 py-1 rounded-full hover:bg-orange-600 transition"
            >
              Login
            </Link>
          )}
        </div>

        {/* 📱 Mobile - Only Veg/Non-Veg Toggle (No Hamburger Menu, No Profile) */}
        {!isLoginPage && (
          <div className="md:hidden flex items-center gap-3">
            {/* 🥗 Toggle Switch for Mobile */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleFilter}
              className={`relative w-10 h-5 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                foodFilter === "Veg"
                  ? "bg-green-500 focus:ring-green-500"
                  : foodFilter === "Non-Veg"
                  ? "bg-red-500 focus:ring-red-500"
                  : "bg-gray-400 focus:ring-gray-400"
              }`}
            >
              <motion.div
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center"
                animate={{
                  x: foodFilter === "Veg" ? 0 : foodFilter === "Non-Veg" ? 20 : 10,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {foodFilter === "Veg" ? (
                  <FaLeaf className="text-green-600 text-[8px]" />
                ) : foodFilter === "Non-Veg" ? (
                  <FaDrumstickBite className="text-red-600 text-[8px]" />
                ) : (
                  <div className="flex gap-0.5">
                    <FaLeaf className="text-gray-500 text-[6px]" />
                    <FaDrumstickBite className="text-gray-500 text-[6px]" />
                  </div>
                )}
              </motion.div>
            </motion.button>
          </div>
        )}
      </div>

    </nav>
  );
};

export default Navbar;
