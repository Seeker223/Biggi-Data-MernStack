import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // Fixed: "context" not "contexts"
import BrandLoader from "./BrandLoader";

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <BrandLoader text="Loading Biggi Data..." />;
  }

  if (!user) return <Navigate to="/launch" />;

  // Biggi House membership is now unlocked via data purchases, not role selection.
  // Keep legacy /user-role route accessible but never force users through it.
  if (location.pathname === "/user-role") {
    return <Outlet />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
