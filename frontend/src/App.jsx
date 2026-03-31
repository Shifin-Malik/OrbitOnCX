import React, { useEffect } from "react";
import { Routes, Route, useLocation, matchPath } from "react-router-dom";
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
import SearchPage from "./pages/SearchPage";
import UserProfilePage from "./components/UserProfilePage";

function App() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      dispatch(getProfile());
    }

    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dispatch]);

  const validPaths = [
    "/",
    "/profile",
    "/search",
    "/quiz",
    "/leetcode",
    "/compiler",
    "/profile/:id",
  ];

  const isNavBarVisible = validPaths.some((path) =>
    matchPath({ path, end: true }, location.pathname),
  );

  return (
    <div className="w-full min-h-screen bg-background text-foreground transition-colors duration-300">
      {isNavBarVisible && <NavBar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/compiler" element={<Compiler />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
