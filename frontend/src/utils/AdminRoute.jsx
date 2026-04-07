import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

 
  if (user && user.role === "admin") {
    return children;
  }

  return <Navigate to="/" state={{ from: location }} replace />;
};

export default AdminRoute;