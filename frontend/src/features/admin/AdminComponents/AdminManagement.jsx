import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAppSelector } from "../../../store/hooks";
import { getAllAdmins, addAdmin, removeAdmin } from "../../../services/adminApi";
import LogoLoader from "../../../components/ui/LogoLoader";

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
      <div className="bg-white shadow-lg rounded-lg sm:rounded-xl p-6">
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
        className="bg-white shadow-lg rounded-lg sm:rounded-xl p-6"
      >
        <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-4">
          👥 Admin Management
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-semibold">
            ⚠️ Access Denied
          </p>
          <p className="text-yellow-700 text-sm mt-2">
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
      <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-4">
        👥 Admin Management
      </h3>

      {/* Add Admin Form */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-gray-800 mb-3">➕ Add New Admin</h4>
        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={addingAdmin}
          />
          <button
            type="submit"
            disabled={addingAdmin || !newAdminEmail.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            {addingAdmin ? "Adding..." : "Add Admin"}
          </button>
        </form>
      </div>

      {/* Admins List */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">
          📋 Current Admins ({admins.length})
        </h4>
        
        {admins.length === 0 ? (
          <p className="text-gray-500 text-sm">No admins found.</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {admins.map((admin, index) => (
                <motion.div
                  key={admin.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {admin.email}
                      </span>
                      {admin.isSuperAdmin && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                          👑 Super Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Added: {new Date(admin.createdAt).toLocaleDateString()}
                      {admin.createdBy !== "system" && (
                        <span> • By: {admin.createdBy}</span>
                      )}
                    </p>
                  </div>
                  
                  {!admin.isSuperAdmin && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.email)}
                      className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors"
                      title="Remove admin"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminManagement;

