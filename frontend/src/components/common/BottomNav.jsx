import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { FaHome, FaUtensils, FaShoppingBag, FaHistory, FaUser, FaUserCog } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { checkAdminStatus } from "../../services/adminApi";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status via API
  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.email) {
        try {
          const result = await checkAdminStatus(user.email);
          setIsAdmin(result.isAdmin || false);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);

  const tabs = [
    { name: "Home", icon: FaHome, path: "/", protected: false },
    { name: "Menu", icon: FaUtensils, path: "/menu", protected: false },
    { name: "Order", icon: FaShoppingBag, path: "/order", protected: true },
    { name: "History", icon: FaHistory, path: "/history", protected: true },
    ...(isAdmin
      ? [
          { name: "Admin", icon: FaUserCog, path: "/admin", protected: true, adminOnly: true },
          { name: "Profile", icon: FaUser, path: "/profile", protected: true, showUserAvatar: true },
        ]
      : [{ name: "Profile", icon: FaUser, path: "/profile", protected: true, showUserAvatar: true }]),
  ];

  const handleTabClick = (tab, e) => {
    if (tab.protected && !user) {
      e.preventDefault();
      toast.error("Please login first");
      navigate("/login");
    }
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          const isProfileTab = tab.showUserAvatar && user;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              onClick={(e) => handleTabClick(tab, e)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 ${
                active ? "text-orange-500" : "text-gray-500"
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1"
              >
                {isProfileTab ? (
                  // Show user profile picture or initial
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                    active ? "border-orange-500" : "border-gray-400"
                  }`}>
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className={`text-xs font-bold ${
                        active ? "text-orange-500" : "text-gray-500"
                      }`}>
                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                ) : (
                  <Icon className={`text-xl ${active ? "text-orange-500" : "text-gray-500"}`} />
                )}
                <span
                  className={`text-xs font-medium ${
                    active ? "text-orange-500" : "text-gray-500"
                  }`}
                >
                  {tab.name}
                </span>
              </motion.div>
              
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-orange-500 rounded-b-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-2 bg-white" />
    </div>
  );
};

export default BottomNav;

