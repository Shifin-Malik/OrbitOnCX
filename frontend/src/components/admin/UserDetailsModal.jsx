import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  updateUserRole,
  getUserDetails,
} from "../../features/admin/adminSlice.js";
import {
  FaTimes,
  FaFire,
  FaChartLine,
  FaCalendarAlt,
  FaPaperPlane,
  FaGamepad,
  FaCheckDouble,
  FaShieldAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const UserDetailsModal = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const [note, setNote] = useState("");
  const [isRoleChanging, setIsRoleChanging] = useState(false);

  if (!user) return null;

  const followersCount =
    user.followersCount ??
    (Array.isArray(user.followers) ? user.followers.length : 0);
  const followingCount =
    user.followingCount ??
    (Array.isArray(user.following) ? user.following.length : 0);

  const handleToggleRole = async () => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setIsRoleChanging(true);

    try {
      await dispatch(
        updateUserRole({ userId: user._id, role: newRole }),
      ).unwrap();
      toast.success(`CLEARANCE: ${newRole.toUpperCase()}`, {
        style: {
          background: "var(--color-background-soft)",
          color: "var(--text-color-primary)",
          border: "1px solid var(--border-color-primary)",
          fontSize: "12px",
        },
      });
      dispatch(getUserDetails(user._id));
    } catch (err) {
      toast.error("OVERRIDE FAILED");
    } finally {
      setIsRoleChanging(false);
    }
  };

  const handleSaveNote = () => {
    if (!note.trim()) return;
    toast.success("Note Appended");
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
      {/* Modal Container: Max width reduced from xl to lg for ~10% width reduction */}
      <div className="bg-[var(--color-background-soft)] backdrop-blur-2xl w-full max-w-lg rounded-[2.2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative border border-[var(--border-color-primary)] flex flex-col max-h-[85vh]">
        {/* --- Close Action --- */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[var(--text-color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-glow)] rounded-lg border border-[var(--border-color-primary)] transition-all z-20"
        >
          <FaTimes size={14} />
        </button>

        <div className="overflow-y-auto scrollbar-hide">
          {/* --- Header: Scaled down padding and avatar --- */}
          <div className="p-8 pb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              {/* Avatar: Reduced from h-32 to h-28 */}
              <div className="h-28 w-28 rounded-[2rem] bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-dark)] p-[2.5px] shadow-[0_0_20px_-5px_var(--color-primary)]">
                <div className="h-full w-full rounded-[1.85rem] bg-[var(--color-background-soft)] flex items-center justify-center text-4xl font-black text-[var(--color-primary)] overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
              </div>
              <span
                className={`absolute bottom-1.5 right-1.5 h-6 w-6 border-[4px] border-[var(--color-background-soft)] rounded-full ${user.status === "Active" || user.status === "Online" ? "bg-[var(--color-success)] animate-pulse" : "bg-[var(--color-danger)]"}`}
              ></span>
            </div>

            <div className="flex-1 w-full lg:mt-8 sm:mt-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
                {/* Title: text-3xl to text-2xl */}
                <h3 className="text-2xl font-black text-[var(--text-color-primary)] tracking-tighter italic uppercase leading-none">
                  {user.name}
                </h3>

                <button
                  disabled={isRoleChanging}
                  onClick={handleToggleRole}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${
                    user.role === "admin"
                      ? "bg-[var(--color-accent-glow)] border-[var(--color-accent)] text-[var(--color-accent)]"
                      : "bg-[var(--color-background-elevated)] border-[var(--border-color-primary)] text-[var(--text-color-secondary)] hover:text-[var(--color-primary)]"
                  }`}
                >
                  {isRoleChanging ? (
                    <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FaShieldAlt size={11} /> Clearance
                    </>
                  )}
                </button>
              </div>

              <p className="text-[12px] font-bold text-[var(--text-color-secondary)] tracking-wider mb-5 uppercase opacity-75">
                {user.email}
              </p>

              <div className="flex justify-center sm:justify-start gap-5 pt-4 border-t border-[var(--border-color-primary)]">
                <div>
                  <p className="text-lg font-black text-[var(--text-color-primary)] leading-none">
                    {followersCount}
                  </p>
                  <p className="text-[8px] uppercase font-black text-[var(--text-color-muted)] tracking-[0.2em] mt-1">
                    Followers
                  </p>
                </div>
                <div className="w-[1px] h-6 bg-[var(--border-color-primary)]"></div>
                <div>
                  <p className="text-lg font-black text-[var(--text-color-primary)] leading-none">
                    {followingCount}
                  </p>
                  <p className="text-[8px] uppercase font-black text-[var(--text-color-muted)] tracking-[0.2em] mt-1">
                    Following
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- Metrics Grid: Reduced padding and icon sizes --- */}
          <div className="px-8 py-6 grid grid-cols-2 gap-4 bg-[var(--color-background-elevated)] border-y border-[var(--border-color-primary)]">
            {[
              {
                label: "Quizzes",
                val: user.totalQuizzes || 0,
                icon: <FaGamepad />,
                color: "text-[var(--color-primary)]",
                bg: "bg-[var(--color-accent-glow)]",
              },
              {
                label: "Solved",
                val: user.solvedQuestions || 0,
                icon: <FaCheckDouble />,
                color: "text-[var(--color-success)]",
                bg: "bg-[var(--color-success-glow)]",
              },
              {
                label: "Streak",
                val: user.streak || 0,
                icon: <FaFire />,
                color: "text-[var(--color-danger)]",
                bg: "bg-[var(--color-danger-glow)]",
              },
              {
                label: "Score",
                val: user.quizScore || "0%",
                icon: <FaChartLine />,
                color: "text-[var(--color-primary)]",
                bg: "bg-[var(--color-accent-glow)]",
              },
            ].map((metric, i) => (
              <div
                key={i}
                className={`p-4 rounded-[1.5rem] border border-[var(--border-color-primary)] flex items-center gap-4 transition-all group ${metric.bg}`}
              >
                <div
                  className={`${metric.color} text-xl group-hover:rotate-12 transition-transform`}
                >
                  {metric.icon}
                </div>
                <div>
                  <p className="text-lg font-black text-[var(--text-color-primary)] leading-none tracking-tight">
                    {metric.val}
                  </p>
                  <p className="text-[8px] uppercase font-black text-[var(--text-color-muted)] tracking-widest mt-1">
                    {metric.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* --- Complexity Breakdown --- */}
          <div className="p-8 pb-5">
            <h4 className="text-[9px] font-black text-[var(--text-color-muted)] uppercase tracking-[0.3em] mb-4 text-center sm:text-left">
              Complexities
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Alpha",
                  val: user.easyCount || 0,
                  color: "text-[var(--color-success)]",
                  border: "border-[var(--color-success-glow)]",
                },
                {
                  label: "Sigma",
                  val: user.mediumCount || 0,
                  color: "text-[var(--color-accent)]",
                  border: "border-[var(--color-accent-glow)]",
                },
                {
                  label: "Omega",
                  val: user.hardCount || 0,
                  color: "text-[var(--color-danger)]",
                  border: "border-[var(--color-danger-glow)]",
                },
              ].map((diff, i) => (
                <div
                  key={i}
                  className={`border ${diff.border} bg-[var(--color-background-soft)] rounded-2xl py-4 flex flex-col items-center group transition-all`}
                >
                  <span
                    className={`${diff.color} text-[8px] uppercase font-black tracking-[0.2em] mb-1.5`}
                  >
                    {diff.label}
                  </span>
                  <span className="text-[var(--text-color-primary)] font-black text-xl tracking-tighter">
                    {diff.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* --- Admin Terminal: Slimmer textarea --- */}
          <div className="px-8 pb-8">
            <div className="relative group">
              <textarea
                rows="2"
                placeholder="APPEND DIRECTIVE..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-[1.5rem] p-5 pr-16 text-[12px] font-bold text-[var(--text-color-primary)] placeholder:text-[var(--text-color-muted)] focus:border-[var(--color-primary)] outline-none resize-none transition-all uppercase"
              ></textarea>
              <button
                onClick={handleSaveNote}
                disabled={!note.trim()}
                className="absolute right-4 bottom-4 h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--color-primary)] text-white disabled:opacity-20 hover:scale-105 active:scale-95 transition-all"
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* --- Footer Info --- */}
        <div className="p-6 bg-[var(--color-background-elevated)] border-t border-[var(--border-color-primary)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-[9px] font-black text-[var(--text-color-muted)] uppercase tracking-widest">
            <FaCalendarAlt className="text-[var(--color-primary)]" />
            Registry:{" "}
            <span className="text-[var(--text-color-secondary)]">
              {new Date(user.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[9px] font-black text-[var(--text-color-muted)] uppercase tracking-widest">
            <span className="h-1 w-1 rounded-full bg-[var(--color-primary)] shadow-[0_0_5px_var(--color-primary)]"></span>
            Sync:{" "}
            <span className="text-[var(--text-color-secondary)]">
              {new Date(user.lastLogin || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
