import React, { useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  matchPath,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProfile } from "./features/auth/authSlice";
import { sendHeartbeat } from "./features/presence/presenceSlice";

// User Pages
import Home from "./pages/Home";
import NavBar from "./components/NavBar";
import ProfilePage from "./pages/ProfilePage";
import Quiz from "./pages/Quiz";
import ProblemListPage from "./pages/problems/ProblemListPage.jsx";
import ProblemSolvePage from "./pages/problems/ProblemSolvePage.jsx";
import Compiler from "./pages/Compiler";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/SearchPage";
import UserProfilePage from "./components/UserProfilePage";
import QuizArena from "./components/quizz/QuizArena";
import MissionDebrief from "./components/quizz/MissionDebrief";

// Admin Pages & Layouts
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import QuizManagement from "./pages/admin/QuizManagement";
import ProblemManagement from "./pages/admin/ProblemManagement";

// Protection Utilities
import ProtectedRoute from "./utils/ProtectedRoute";
import AdminRoute from "./utils/AdminRoute";

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

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

  useEffect(() => {
    if (!user?._id) return;

    dispatch(sendHeartbeat());
    const intervalId = setInterval(() => {
      dispatch(sendHeartbeat());
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [dispatch, user?._id]);

  const userPaths = [
    "/",
    "/profile",
    "/search",
    "/quiz",
    "/leetcode",
    "/compiler",
    "/profile/:id",
  ];

  // NavBar is visible only on userPaths AND if the user is NOT an admin
  const isNavBarVisible =
    user?.role !== "admin" &&
    userPaths.some((path) => matchPath({ path, end: true }, location.pathname));

  return (
    <div className="w-full min-h-screen bg-[var(--color-background)] text-[var(--text-color-primary)] transition-colors duration-300">
      {isNavBarVisible && <NavBar />}

      <Routes>
        {/* --- Public/Landing Route --- */}
        {/* If an Admin hits '/', redirect them to their dashboard automatically */}
        <Route
          path="/"
          element={
            user?.role === "admin" ? <Navigate to="/admin" replace /> : <Home />
          }
        />

        {/* --- User Routes (All protected from Admins) --- */}
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
          path="/quiz-arena/:id"
          element={
            <ProtectedRoute>
              <QuizArena />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mission-debrief"
          element={
            <ProtectedRoute>
              <MissionDebrief />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leetcode"
          element={
            <ProtectedRoute>
              <ProblemListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leetcode/:slug"
          element={
            <ProtectedRoute>
              <ProblemSolvePage />
            </ProtectedRoute>
          }
        />

        {/* --- Admin Routes (All protected from Users) --- */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="quizzes" element={<QuizManagement />} />
          <Route path="problems" element={<ProblemManagement />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
