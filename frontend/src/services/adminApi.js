import axios from "axios";
import API_BASE from "./api.js";

// Check if user is admin
export const checkAdminStatus = async (email) => {
  try {
    const response = await axios.get(`${API_BASE}/api/admin/check`, {
      params: { email },
    });
    return response.data;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return {
      success: false,
      isAdmin: false,
      isSuperAdmin: false,
    };
  }
};

// Get all admins (super admin only)
export const getAllAdmins = async (requesterEmail) => {
  try {
    const response = await axios.get(`${API_BASE}/api/admin/all`, {
      params: { requesterEmail },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw error;
  }
};

// Add admin (super admin only)
export const addAdmin = async (email, requesterEmail) => {
  try {
    const response = await axios.post(`${API_BASE}/api/admin/add`, {
      email,
      requesterEmail,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding admin:", error);
    throw error;
  }
};

// Remove admin (super admin only)
export const removeAdmin = async (email, requesterEmail) => {
  try {
    const response = await axios.delete(`${API_BASE}/api/admin/remove`, {
      data: { email, requesterEmail },
    });
    return response.data;
  } catch (error) {
    console.error("Error removing admin:", error);
    throw error;
  }
};

