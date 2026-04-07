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
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-background)] text-[var(--text-color-primary)] transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-primary)] border-t-transparent mb-4"></div>
        <p className="animate-pulse text-[var(--text-color-secondary)] font-bold text-[12px] uppercase tracking-widest">
          Verifying Session...
        </p>
      </div>
    );
  }

  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
