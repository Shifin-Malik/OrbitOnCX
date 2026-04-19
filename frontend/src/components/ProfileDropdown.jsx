import React from "react";
import {
  FaTrophy,
  FaListOl,
  FaSignOutAlt,
  FaBook,
  FaBookmark,
  FaMedal,
  FaSun,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { MdQuiz, MdOutlineVerified } from "react-icons/md";
import { logout, resetAuthState } from "../features/auth/authSlice";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = ({ handleAction = () => {} }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const defaultAvatar =
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Orbiton";

  const totalSolved =
    user?.totalSolved ??
    user?.stats?.totalSolved ??
    (user?.problemsSolved?.easy?.length || 0) +
      (user?.problemsSolved?.medium?.length || 0) +
      (user?.problemsSolved?.hard?.length || 0);

  const handleLogout = () => {
    toast.success("Successfully logged out");
    setTimeout(() => {
      dispatch(logout());
      dispatch(resetAuthState());
    }, 600);
  };

  const quickActions = [
    {
      label: "Lists",
      icon: <FaListOl className="text-blue-400" />,
      path: "/lists",
    },
    {
      label: "Note",
      icon: <FaBook className="text-emerald-400" />,
      path: "/notebook",
    },
    {
      label: "Saved",
      icon: <FaBookmark className="text-rose-400" />,
      path: "/bookmarks",
    },
    {
      label: "Medals",
      icon: <FaMedal className="text-orange-400" />,
      path: "/achievements",
    },
    {
      label: "Quiz",
      icon: <MdQuiz className="text-purple-400" />,
      path: "/quiz-leaderboard",
    },
    {
      label: "Rank",
      icon: <FaTrophy className="text-amber-400" />,
      path: "/leaderboard",
    },
  ];

  return (
    <div className="absolute right-0 top-[calc(100%+12px)] w-[17rem] sm:w-[18rem] bg-background-soft/95 border border-primary/15 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.35)] p-4 z-50 animate-in fade-in zoom-in duration-200 backdrop-blur-xl ring-1 ring-white/5 origin-top-right">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative shrink-0">
          <div className="p-0.5 rounded-xl bg-linear-to-tr from-primary to-accent shadow-md">
            <img
              onClick={() => navigate("/profile")}
              src={user?.avatar || defaultAvatar}
              className="w-11 h-11 rounded-[10px] border border-background-soft object-cover cursor-pointer"
              alt="Avatar"
            />
          </div>

          {user?.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border border-background-soft shadow-sm">
              <MdOutlineVerified className="text-white text-[9px]" />
            </div>
          )}
        </div>

        <div className="overflow-hidden flex-1 min-w-0">
          <h4 className="font-black text-primary truncate text-[14px] tracking-tight leading-none mb-1">
            {user?.name || "Developer"}
          </h4>
          <p className="text-[10px] text-muted truncate">
            {user?.email || "Welcome back"}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white/3 backdrop-blur-md rounded-xl py-3 px-2 mb-4 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        {[
          {
            label: "Solved",
            val: totalSolved || 0,
            color: "text-primary",
          },
          {
            label: "XP",
            val: `${user?.totalXp || 0}xp`,
            color: "text-primary",
          },
          {
            label: "Streak",
            val: `${user?.streak || 0}🔥`,
            color: "text-primary",
          },
        ].map((stat, i) => (
          <React.Fragment key={i}>
            <div className="text-center flex-1">
              <p className="text-[7px] font-black text-muted/50 uppercase tracking-[0.14em] mb-1">
                {stat.label}
              </p>
              <p
                className={`text-[12px] font-black tracking-tight ${stat.color}`}
              >
                {stat.val}
              </p>
            </div>
            {i < 2 && (
              <div className="w-px h-5 bg-linear-to-b from-transparent via-white/10 to-transparent"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {quickActions.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleAction(item.path)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-white/5 hover:bg-primary border border-white/5 hover:border-primary/40 cursor-pointer transition-all duration-300 group shadow-sm hover:-translate-y-0.5"
          >
            <span className="text-base mb-1.5 group-hover:scale-110 group-hover:text-white transition-all duration-300">
              {item.icon}
            </span>
            <span className="text-[7px] font-black uppercase tracking-tight">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-1 pt-3 border-t border-white/5">
        <button
          onClick={() => handleAction("/profile")}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
        >
          <FaSun
            size={12}
            className="group-hover:rotate-90 transition-transform duration-500"
          />
          Theme
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
        >
          <FaSignOutAlt size={12} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
