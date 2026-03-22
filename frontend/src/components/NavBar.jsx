import React, { useState, useEffect } from "react";
import { HiOutlineMenu, HiX } from "react-icons/hi";
import { NavLink, useNavigate } from "react-router-dom";
import { IoIosHome } from "react-icons/io";
import { FaCode, FaMoon, FaSun } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import { FaQuestionCircle } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import Login from "../pages/Login.jsx";
import { IoPersonCircle } from "react-icons/io5";
import { getProfile } from "../features/auth/authSlice.js";

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("signup");
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  
  const { user, loading } = useSelector((state) => state.auth);

  
  useEffect(() => {
    if (user) {
      console.log("Current User Data:", user);
    }
  }, [user]);


  useEffect(() => {
    const hasToken = document.cookie.includes("accessToken");

   
    if (!user && hasToken && !loading) {
      dispatch(getProfile());
    }
  }, [dispatch, user, loading]);

 
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  const allLinks = [
    { id: 1, name: "Home", icon: IoIosHome, path: "/" },
    { id: 2, name: "Compiler", icon: FaCode, path: "/compiler" },
    { id: 3, name: "Problems", icon: SiLeetcode, path: "/leetcode" },
    { id: 4, name: "Quiz", icon: FaQuestionCircle, path: "/quiz" },
    { id: 5, name: "Profile", icon: IoPersonCircle, path: "/profile" },
  ];

  const links = user ? allLinks : allLinks.slice(0, 2);

  const navStyle = ({ isActive }) =>
    `px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-bold text-[11px] uppercase tracking-[0.1em] ${
      isActive
        ? "bg-primary text-white shadow-lg"
        : "text-secondary hover:text-primary hover:bg-secondary/20"
    }`;

  const openModal = (mode) => {
    setModalMode(mode);
    setModalOpen(true);
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 px-6 md:px-16 flex justify-between items-center ${
          scrolled
            ? "bg-background-soft/90 backdrop-blur-md py-3 border-b border-primary shadow-sm"
            : "bg-transparent py-6"
        }`}
      >
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="p-2.5 bg-linear-to-br from-primary to-accent rounded-xl shadow-lg group-hover:rotate-6 transition-transform text-white">
            <FaCode size={20} />
          </div>
          <span className="text-2xl font-black text-primary tracking-tighter">
            Orbiton<span className="text-primary">CX</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-primary/5 p-1.5 rounded-2xl border border-primary/10 backdrop-blur-sm">
          {links.map((link) => (
            <NavLink key={link.id} to={link.path} className={navStyle}>
              <link.icon className="text-sm" />
              {link.name}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-secondary text-primary hover:scale-105 transition"
          >
            {darkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>

          {loading ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : !user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openModal("signin")}
                className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openModal("signup")}
                className="px-6 py-3 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-4 pl-4 border-l border-secondary cursor-pointer group active:scale-95 transition-transform"
              onClick={() => navigate("/profile")}
            >
              <div className="text-right hidden lg:block">
                <p className="text-[9px] text-primary font-black uppercase tracking-widest leading-none mb-1">
                  Developer
                </p>
                <p className="text-sm font-black text-primary group-hover:text-primary transition-colors">
                  {user?.name?.split(" ")[0] || "User"}
                </p>
              </div>
              <div className="relative p-0.5 rounded-xl bg-linear-to-tr from-primary to-accent">
                <img
                  src={
                    user?.avatar ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Orbiton"
                  }
                  alt="profile"
                  className="w-9 h-9 rounded-[10px] object-cover border-2 border-white"
                  onError={(e) => {
                    e.target.src =
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=Orbiton";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2 text-secondary bg-secondary rounded-xl"
          onClick={() => setMenuOpen(true)}
        >
          <HiOutlineMenu size={24} />
        </button>
      </nav>

      
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          ></div>
          <div className="absolute right-0 w-72 h-full bg-background-soft p-8 shadow-2xl flex flex-col">
            <button
              className="self-end p-2 text-muted"
              onClick={() => setMenuOpen(false)}
            >
              <HiX size={20} />
            </button>
            <div className="mt-12 flex flex-col gap-3">
              {links.map((link) => (
                <NavLink
                  key={link.id}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={navStyle}
                >
                  <link.icon size={18} /> {link.name}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <Login
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
      />
    </>
  );
}

export default NavBar;
