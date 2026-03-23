import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // 1. ലോഗിൻ ചെയ്തിട്ടില്ലെങ്കിൽ ഉടൻ ഹോമിലേക്ക് വിടുക
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // 2. യൂസർ ഡാറ്റ ഓൾറെഡി സ്റ്റേറ്റിൽ ഉണ്ടെങ്കിൽ ലോഡിംഗ് നോക്കേണ്ടതില്ല.
  // ഇത് കമ്പൈലർ റൺ ചെയ്യുമ്പോഴുണ്ടാകുന്ന ലോഡിംഗ് പ്രൊഫൈൽ പേജിനെ ബാധിക്കുന്നത് തടയും.
  if (user) {
    return children;
  }

  // 3. യൂസർ ഡാറ്റ ഇല്ലെങ്കിൽ മാത്രം ലോഡിംഗ് സ്ക്രീൻ കാണിക്കുക (Initial login/refresh)
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
