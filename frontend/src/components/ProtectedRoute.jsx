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

  if (!user) return <Navigate to="/login" />;

  const userRole = user?.userRole;
  if (!userRole && location.pathname !== "/user-role") {
    return <Navigate to="/user-role" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
