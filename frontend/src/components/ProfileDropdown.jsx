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

const ProfileDropdown = ({ handleAction }) => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    toast.success("Successfully logged out");
    setTimeout(() => {
      dispatch(logout());
      dispatch(resetAuthState());
    }, 600);
  };

  return (
    <div className="absolute right-5 mt-[46%] w-[20rem] bg-background-soft/95 border border-primary/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-[1.15rem] z-50 animate-in fade-in zoom-in duration-200 backdrop-blur-xl ring-1 ring-white/5 origin-top-right">
      <div className="flex items-center gap-3.5 mb-5 px-1">
        <div className="relative">
          <div className="p-0.5 rounded-xl bg-linear-to-tr from-primary to-accent shadow-md">
            <img
              src={
                user?.avatar ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Orbiton"
              }
              className="w-12 h-12 rounded-[10px] border border-background-soft object-cover"
              alt="Avatar"
            />
          </div>
          {user?.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border border-background-soft shadow-sm">
              <MdOutlineVerified className="text-white text-[9px]" />
            </div>
          )}
        </div>

        <div className="overflow-hidden flex-1">
          <h4 className="font-black text-primary truncate text-[15px] tracking-tight leading-none mb-1.5">
            {user?.name || "Developer"}
          </h4>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white/3 backdrop-blur-md rounded-2xl py-3.5 px-2 mb-6 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        {[
          {
            label: "Points",
            val:
              (user?.problemsSolved?.easy?.length || 0) +
              (user?.problemsSolved?.medium?.length || 0),
            color: "text-primary",
          },
          {
            label: "Streak",
            val: `${user?.streak || 0}🔥`,
            color: "text-primary",
          },
          {
            label: "Rank",
            val: "#1.2k",
            color: "text-primary",
          },
        ].map((stat, i) => (
          <React.Fragment key={i}>
            <div className="group text-center flex-1 transition-transform duration-300 hover:-translate-y-0.5 cursor-default">
              <p className="text-[7px] font-black text-muted/40 uppercase tracking-[0.15em] mb-1 group-hover:text-muted/60 transition-colors">
                {stat.label}
              </p>
              <p
                className={`text-[13px] font-black tracking-tight ${stat.color || "text-primary"}`}
              >
                {stat.val}
              </p>
            </div>
            {i < 2 && (
              <div className="w-px h-6 bg-linear-to-b from-transparent via-white/10 to-transparent"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
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
        ].map((item, index) => (
          <div
            key={index}
            onClick={() => handleAction(item.path)}
            className="flex flex-col items-center justify-center py-3 rounded-xl bg-white/5  hover:bg-primary border border-white/5 hover:border-primary/40 cursor-pointer transition-all duration-300 group shadow-sm hover:-translate-y-0.5"
          >
            <span className="text-lg mb-1.5 group-hover:scale-110 group-hover:text-white transition-all duration-300">
              {item.icon}
            </span>
            <span className="text-[8px] font-black uppercase tracking-tighter dark:">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1 pt-3 border-t border-white/5">
        <button
          onClick={() => handleAction("/profile")}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
        >
          <FaSun
            size={12}
            className="group-hover:rotate-90 transition-transform duration-500"
          />{" "}
          Theme
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
        >
          <FaSignOutAlt size={12} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
