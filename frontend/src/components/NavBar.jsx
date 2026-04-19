import React, { useState, useEffect, memo, useCallback, useRef } from "react";
import { HiOutlineMenu, HiX } from "react-icons/hi";
import { NavLink, useNavigate } from "react-router-dom";
import { IoIosHome } from "react-icons/io";
import {
  FaCode,
  FaMoon,
  FaSun,
  FaSearch,
  FaQuestionCircle,
} from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import { useSelector } from "react-redux";
import Login from "../pages/Login.jsx";
import ProfileDropdown from "./ProfileDropdown.jsx";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("signup");
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const isAuthLoading = useSelector((state) => state.auth.loading);

  const defaultAvatar =
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Orbiton";
  const [imgSrc, setImgSrc] = useState(defaultAvatar);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest("[data-mobile-menu-button]")
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const isDark = savedTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    setImgSrc(user?.avatar || defaultAvatar);
  }, [user?.avatar]);

  const toggleTheme = useCallback(() => {
    const nextDarkMode = !darkMode;
    document.documentElement.classList.toggle("dark", nextDarkMode);
    localStorage.setItem("theme", nextDarkMode ? "dark" : "light");
    setDarkMode(nextDarkMode);
  }, [darkMode]);

  const allLinks = [
    { id: 1, name: "Home", icon: IoIosHome, path: "/" },
    { id: 2, name: "Compiler", icon: FaCode, path: "/compiler" },
    { id: 3, name: "Search", icon: FaSearch, path: "/search" },
    { id: 4, name: "Problems", icon: SiLeetcode, path: "/leetcode" },
    { id: 5, name: "Quiz", icon: FaQuestionCircle, path: "/quiz" },
  ];

  const links = user ? allLinks : allLinks.slice(0, 2);

  const navStyle = ({ isActive }) =>
    `px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-bold text-[11px] uppercase tracking-[0.1em] ${
      isActive
        ? "bg-primary text-white shadow-lg"
        : "text-secondary hover:text-primary hover:bg-secondary/20"
    }`;

  const handleProfileClick = () => {
    if (user) {
      setDropdownOpen((prev) => !prev);
    } else {
      setModalMode("signin");
      setModalOpen(true);
    }
  };

  const openSigninModal = () => {
    setModalMode("signin");
    setModalOpen(true);
    setMenuOpen(false);
  };

  const openSignupModal = () => {
    setModalMode("signup");
    setModalOpen(true);
    setMenuOpen(false);
  };

  const handleMobileProfile = () => {
    setMenuOpen(false);
    if (user) {
      navigate("/profile");
    } else {
      openSigninModal();
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 px-6 md:px-8 flex justify-between items-center ${
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
            title="Toggle Theme"
          >
            {darkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>

          {isAuthLoading && !user ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : !user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={openSigninModal}
                className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={openSignupModal}
                className="px-6 py-3 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div
              ref={dropdownRef}
              className="relative flex items-center gap-4 pl-4 border-l border-secondary cursor-pointer group"
            >
              <div onClick={handleProfileClick}>
                <div className="relative p-0.5 rounded-xl bg-linear-to-tr from-primary to-accent">
                  <img
                    src={imgSrc}
                    alt="profile"
                    className="w-9 h-9 rounded-[10px] object-cover border-2 border-white"
                    onError={() => setImgSrc(defaultAvatar)}
                  />
                </div>
              </div>

              {dropdownOpen && (
                <ProfileDropdown
                  user={user}
                  onClose={() => setDropdownOpen(false)}
                />
              )}
            </div>
          )}
        </div>

        <button
          data-mobile-menu-button
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

          <div
            ref={mobileMenuRef}
            className="absolute right-0 w-72 h-full bg-background-soft p-6 shadow-2xl flex flex-col border-l border-primary/10"
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-black text-primary">Menu</div>
              <button
                className="p-2 text-muted"
                onClick={() => setMenuOpen(false)}
              >
                <HiX size={20} />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 p-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                  Theme
                </p>
                <p className="text-xs font-bold text-primary">
                  {darkMode ? "Dark Mode" : "Light Mode"}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-secondary text-primary"
                title="Toggle Theme"
              >
                {darkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {links.map((link) => (
                <NavLink
                  key={link.id}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={navStyle}
                >
                  <link.icon size={18} />
                  {link.name}
                </NavLink>
              ))}
            </div>

            <div className="mt-6 border-t border-primary/10 pt-6">
              {isAuthLoading && !user ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                <div className="space-y-4">
                  <button
                    onClick={handleMobileProfile}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10"
                  >
                    <img
                      src={imgSrc}
                      alt="profile"
                      className="w-10 h-10 rounded-xl object-cover border border-white"
                      onError={() => setImgSrc(defaultAvatar)}
                    />
                    <div className="text-left">
                      <p className="text-xs font-black text-primary">
                        {user?.name || "User"}
                      </p>
                      <p className="text-[10px] text-muted">View Profile</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={openSigninModal}
                    className="w-full px-5 py-3 rounded-xl border bg-secondary border-primary/10 text-[11px] font-black uppercase tracking-widest text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openSignupModal}
                    className="w-full px-5 py-3 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Get Started
                  </button>
                </div>
              )}
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
};

export default memo(NavBar);
