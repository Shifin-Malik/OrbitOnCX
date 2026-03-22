import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProfile } from "./features/auth/authSlice";
import Home from "./pages/Home";
import NavBar from "./components/NavBar";
import ProfilePage from "./pages/ProfilePage";
import Quiz from "./pages/Quiz";
import ProblemListUI from "./pages/ProblemListUI";
import Compiler from './pages/Compiler'
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthStatus = localStorage.getItem("isLoggedIn") === "true";
    if (checkAuthStatus) {
      dispatch(getProfile());
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dispatch]);

  const validPaths = ["/", "/profile", "/quiz", "/leetcode", "/compiler"];
  const isUnknownPage = !validPaths.includes(location.pathname);

  return (
    <div className="w-full min-h-screen bg-background transition-colors duration-300">
      {!isUnknownPage && <NavBar />}

      <Routes>
        <Route path="/" element={<Home />} />

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

        <Route path="/compiler" element={<Compiler />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
