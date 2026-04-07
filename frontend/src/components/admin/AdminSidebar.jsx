import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaUsers,
  FaTasks,
  FaCode,
  FaSignOutAlt,
  FaChartPie,
} from "react-icons/fa";

const AdminSidebar = () => {
  const { pathname } = useLocation();
  const menu = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <FaChartPie /> },
    { name: "Users", path: "/admin/users", icon: <FaUsers /> },
    { name: "Quizzes", path: "/admin/quizzes", icon: <FaTasks /> },
    { name: "Problems", path: "/admin/problems", icon: <FaCode /> },
  ];

  return (
    <div className="w-64 h-full bg-background-soft/95 backdrop-blur-xl border-r border-border-primary/40 flex flex-col shadow-[4px_0_24px_-2px_rgba(0,0,0,0.03)] z-10 relative">
      <div className="h-20 flex items-center px-8 relative">
        <h1 className="text-2xl font-black tracking-tighter italic z-10">
          <span className="text-primary">ORBITON</span>
          <span className="text-text-primary">CX</span>
        </h1>

        <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-border-primary/60 to-transparent"></div>
      </div>

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
                className={`text-lg transition-transform duration-300 ${
                  isActive
                    ? "scale-110"
                    : "group-hover:scale-110 group-hover:-rotate-3"
                }`}
              >
                {item.icon}
              </span>

              <span className="tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 bg-background-soft/50 relative">
        
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-border-primary/60 to-transparent"></div>

        <button className="group flex items-center justify-center gap-3 px-4 py-3.5 w-full rounded-xl text-sm font-bold text-white  bg-rose-500 hover:bg-rose-700 hover:text-white transition-all duration-300 active:scale-95">
          <span className="text-lg transition-transform duration-300 group-hover:-translate-x-1">
            <FaSignOutAlt />
          </span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
