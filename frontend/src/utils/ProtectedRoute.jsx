import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

 
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }


  if (user) {
    return children;
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-green-500 mb-4"></div>
        <p className="animate-pulse">Verifying Session...</p>
      </div>
    );
  }

  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
