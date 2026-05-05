import React, { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";

function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setLoading(true);
        const response = await fetch(api().getAcess, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (response.ok && result.status && result.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          if (result.status && !result.isAdmin) {
            toast.error("Access denied: Admin privileges required");
          }
        }
      } catch (err) {
        console.error("AdminRoute error:", err);
        setIsAdmin(false);
        toast.error("Failed to verify admin access");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  if (loading) {
    return (
      <div className="h-screen font-bold text-4xl flex justify-center items-center text-white bg-gradient-to-r from-orange-500 to-orange-600">
        Verifying Access...
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}

export default AdminRoute;
