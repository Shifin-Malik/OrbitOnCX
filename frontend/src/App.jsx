// App.js
import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getProfile } from "./features/auth/authSlice";
import Home from "./pages/Home";
import NavBar from "./components/NavBar";
import ProfilePage from "./pages/ProfilePage";
import Quiz from "./pages/Quiz";
import ProblemListUI from "./pages/ProblemListUI";
import Compiler from "./pages/Compiler";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Auth Logic: ബ്രൗസർ ഓപ്പൺ ചെയ്യുമ്പോൾ ലോഗിൻ സ്റ്റാറ്റസ് ചെക്ക് ചെയ്യുക
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      dispatch(getProfile());
    }

    // 2. Theme Logic: ഡാർക്ക് മോഡ് കൃത്യമായി വർക്ക് ചെയ്യാൻ
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dispatch]);

  // NavBar കാണിക്കേണ്ട പാതകൾ (Paths)
  const validPaths = ["/", "/profile", "/quiz", "/leetcode", "/compiler"];
  const isNavBarVisible = validPaths.includes(location.pathname);

  return (
    <div className="w-full min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* NavBar ലോഡ് ചെയ്യുമ്പോൾ യൂസർ ഉണ്ടോ എന്ന് NavBar തന്നെ Redux-ൽ നിന്ന് എടുത്തോളും */}
      {isNavBarVisible && <NavBar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/compiler" element={<Compiler />} />

        {/* Protected Routes: ലോഗിൻ ചെയ്താൽ മാത്രം പ്രവേശനം */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leetcode"
          element={
            <ProtectedRoute>
              <ProblemListUI />
            </ProtectedRoute>
          }
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
