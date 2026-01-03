import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAppSelector } from "../../../store/hooks";
import { getAllAdmins, addAdmin, removeAdmin } from "../../../services/adminApi";
import LogoLoader from "../../../components/ui/LogoLoader";
import API_BASE from "../../../config/api";

/**
 * Admin Management Component
 * Allows super admin to add/remove admins
 */
const AdminManagement = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Load admins list
  const loadAdmins = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const result = await getAllAdmins(user.email);
      
      if (result.success) {
        setAdmins(result.admins || []);
        // Check if current user is super admin
        const currentUserAdmin = result.admins.find(
          (admin) => admin.email === user.email
        );
        setIsSuperAdmin(currentUserAdmin?.isSuperAdmin || false);
      } else {
        toast.error(result.message || "Failed to load admins");
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error("Error loading admins:", error);
      const errorMessage = error.response?.data?.message || "Failed to load admins";
      toast.error(errorMessage);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [user]);

  // Add new admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!newAdminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!user?.email) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setAddingAdmin(true);
      const result = await addAdmin(newAdminEmail.trim(), user.email);
      
      if (result.success) {
        toast.success(`✅ ${result.message || "Admin added successfully"}`);
        setNewAdminEmail("");
        loadAdmins(); // Reload admins list
      } else {
        toast.error(result.message || "Failed to add admin");
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      const errorMessage = error.response?.data?.message || "Failed to add admin";
      toast.error(errorMessage);
    } finally {
      setAddingAdmin(false);
    }
  };

  // Remove admin
  const handleRemoveAdmin = async (email) => {
    if (!user?.email) {
      toast.error("User not authenticated");
      return;
    }

    const confirmed = window.confirm(
      `🗑️ Are you sure you want to remove ${email} as an admin?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const result = await removeAdmin(email, user.email);
      
      if (result.success) {
        toast.success(`✅ ${result.message || "Admin removed successfully"}`);
        loadAdmins(); // Reload admins list
      } else {
        toast.error(result.message || "Failed to remove admin");
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      const errorMessage = error.response?.data?.message || "Failed to remove admin";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6">
        <LogoLoader />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-lg rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6"
      >
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-700 mb-3 sm:mb-4">
          👥 Admin Management
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <p className="text-yellow-800 font-semibold text-sm sm:text-base">
            ⚠️ Access Denied
          </p>
          <p className="text-yellow-700 text-xs sm:text-sm mt-2">
            Only super admins can manage other admins.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="bg-white shadow-lg rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6"
    >
      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-700 mb-3 sm:mb-4">
        👥 Admin Management
      </h3>

      {/* Add Admin Form */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
          ➕ Add New Admin
        </h4>
        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={addingAdmin}
          />
          <button
            type="submit"
            disabled={addingAdmin || !newAdminEmail.trim()}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            {addingAdmin ? "Adding..." : "Add Admin"}
          </button>
        </form>
      </div>

      {/* Admins List */}
      <div>
        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
          📋 Current Admins ({admins.length})
        </h4>
        
        {admins.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-sm sm:text-base">No admins found.</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <AnimatePresence>
              {admins.map((admin, index) => (
                <motion.div
                  key={admin.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-0">
                      <span className="font-semibold text-gray-800 text-sm sm:text-base break-all sm:break-words">
                        {admin.email}
                      </span>
                      {admin.isSuperAdmin && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded w-fit">
                          👑 Super Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                      <span className="block sm:inline">
                        Added: {new Date(admin.createdAt).toLocaleDateString()}
                      </span>
                      {admin.createdBy !== "system" && (
                        <span className="block sm:inline sm:ml-1">
                          • By: <span className="break-all">{admin.createdBy}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {!admin.isSuperAdmin && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.email)}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
                      title="Remove admin"
                    >
                      <span>🗑️</span>
                      <span>Remove</span>
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <hr className="my-6 border-gray-100" />
      
      {/* 🔔 Notification Diagnostics */}
      <div>
        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
          🔔 Notification Diagnostics
        </h4>
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
              <span className="text-sm text-gray-600">Browser Support:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${'Notification' in window ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {'Notification' in window ? '✅ Supported' : '❌ Unsupported'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
              <span className="text-sm text-gray-600">Permission:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                Notification.permission === 'granted' ? 'bg-green-100 text-green-700' : 
                Notification.permission === 'denied' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {Notification.permission === 'granted' ? '✅ Granted' : 
                 Notification.permission === 'denied' ? '🚫 Denied' : '⏳ Prompt/Default'}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mb-4">
            If you are not receiving order notifications, ensure you have allowed notifications in your browser settings and your system is not in "Concentration" or "Do Not Disturb" mode.
          </p>
          
          <button
            onClick={async () => {
              try {
                const toastId = toast.loading("Sending test push...");
                const response = await axios.post(`${API_BASE}/api/push/send`, {
                  userEmail: user.email,
                  title: "🧪 Test Notification",
                  body: "If you see this, push notifications are working correctly for your account!",
                  tag: "test-notification-" + Date.now()
                });
                
                if (response.data.success) {
                  toast.success("✅ Test notification sent to your browser!", { id: toastId });
                } else {
                  toast.error("❌ " + (response.data.error || "Failed to send"), { id: toastId });
                }
              } catch (error) {
                console.error("Test push error:", error);
                const msg = error.response?.data?.error || "Connection error. Make sure your browser is subscribed.";
                toast.error("❌ " + msg);
              }
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>Send Test Push to My Device</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminManagement;

