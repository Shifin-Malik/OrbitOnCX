import React, { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FaUsers,
  FaTasks,
  FaCode,
  FaSignOutAlt,
  FaChartPie,
  FaMoon,
  FaSun,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { logout, resetAuthState } from "../../features/auth/authSlice";
import { toast } from "react-hot-toast";

const AdminSidebar = () => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State for mobile toggle
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark"),
  );

  const handleLogout = useCallback(() => {
    toast.success("Logging out...");
    setTimeout(() => {
      dispatch(logout());
      dispatch(resetAuthState());
      navigate("/");
    }, 600);
  }, [dispatch, navigate]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const menu = [
    { name: "Dashboard", path: "/admin", icon: <FaChartPie /> },
    { name: "Users", path: "/admin/users", icon: <FaUsers /> },
    { name: "Quizzes", path: "/admin/quizzes", icon: <FaTasks /> },
    { name: "Problems", path: "/admin/problems", icon: <FaCode /> },
  ];

  return (
    <>
      {/* --- Mobile Top Bar --- */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-background-soft border-b border-white/10 sticky top-0 z-40">
        <h1 className="text-xl font-black italic tracking-tighter">
          <span className="text-accent">ORBITON</span> CX
        </h1>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-primary bg-primary/10 rounded-lg"
        >
          <FaBars size={20} />
        </button>
      </div>

      {/* --- Overlay (Mobile Only) --- */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- Sidebar Container --- */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 h-full bg-background-soft/95 backdrop-blur-xl border-r border-white/6 
        flex flex-col shadow-[4px_0_24px_-2px_rgba(0,0,0,0.03)]
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-8 relative">
          <h1 className="text-2xl font-black tracking-tighter italic">
            <span className="text-accent">ORBITON</span>
            <span className="text-text-primary">CX</span>
          </h1>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-text-muted hover:text-rose-500"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 opacity-70">
            Main Menu
          </p>

          {menu.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)} // Close on mobile navigation
                className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1"
                    : "text-text-secondary hover:bg-background-elevated hover:text-primary hover:translate-x-1"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-md"></span>
                )}
                <span
                  className={`text-lg transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:-rotate-3"}`}
                >
                  {item.icon}
                </span>
                <span className="tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 bg-background-soft/50 relative flex flex-col gap-2">
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-border-primary/60 to-transparent"></div>

          {/* Corrected Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="group flex items-center justify-center gap-3 px-4 py-3.5 w-full rounded-xl text-sm font-bold text-text-primary bg-background-elevated border border-white/5 hover:border-primary/30 transition-all duration-300 active:scale-95"
          >
            <span className="text-lg transition-transform duration-300 text-accent">
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </span>
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group flex items-center justify-center gap-3 px-4 py-3.5 w-full rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all duration-300 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <span className="text-lg transition-transform duration-300 group-hover:-translate-x-1">
              <FaSignOutAlt />
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
