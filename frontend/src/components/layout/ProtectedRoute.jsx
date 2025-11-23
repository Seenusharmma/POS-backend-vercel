import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { checkAdminStatus } from "../../services/adminApi";
import toast from "react-hot-toast";

/**
 * Protects specific routes.
 * Pass `adminOnly` to restrict only to admin users.
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      // Check admin status if adminOnly route
      if (adminOnly && user.email) {
        setCheckingAdmin(true);
        checkAdminStatus(user.email)
          .then((result) => {
            setIsAdmin(result.isAdmin || false);
            if (!result.isAdmin) {
              toast.error("Access denied! Admins only.");
              navigate("/");
            }
          })
          .catch((error) => {
            console.error("Error checking admin status:", error);
            toast.error("Failed to verify admin status");
            navigate("/");
          })
          .finally(() => {
            setCheckingAdmin(false);
          });
      }
    }
  }, [user, loading, navigate, adminOnly]);

  if (loading || (adminOnly && checkingAdmin)) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl font-semibold text-gray-600">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (adminOnly && !isAdmin) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
