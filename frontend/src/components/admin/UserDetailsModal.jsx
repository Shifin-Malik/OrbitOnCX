import React, { useState } from "react";
import {
  FaTimes,
  FaFire,
  FaCode,
  FaQuestionCircle,
  FaChartLine,
  FaCalendarAlt,
  FaPaperPlane,
} from "react-icons/fa";

const UserDetailsModal = ({ user, onClose }) => {
  const [note, setNote] = useState("");

  if (!user) return null;

  const handleSaveNote = () => {
    if (!note.trim()) return;
    // Add your dispatch/API call here to save the note
    console.log(`Saving note for ${user.name}:`, note);
    setNote(""); // Clear after sending
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-background-soft/95 backdrop-blur-2xl w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden relative border border-[var(--border-color-primary)] flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-text-muted hover:text-danger hover:bg-danger-glow rounded-full border border-[var(--border-color-primary)] transition-all z-10"
        >
          <FaTimes size={14} />
        </button>

        {/* Scrollable Content Area - Removed Scrollbar */}
        <div className="overflow-y-auto scrollbar-hide">
          {/* Header: Cinematic Profile */}
          <div className="p-8 pb-6 flex items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-primary to-primary-dark p-[2px] shadow-lg shadow-accent-glow">
                <div className="h-full w-full rounded-[1.9rem] bg-background-soft flex items-center justify-center text-3xl font-black text-primary overflow-hidden">
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
              {/* Online/Status Indicator */}
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 border-4 border-[var(--border-color-primary)] rounded-full ${
                  user.status === "Active" ? "bg-success" : "bg-danger"
                }`}
              ></span>
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-black text-text-primary tracking-tighter italic uppercase">
                {user.name}
              </h3>
              <p className="text-xs font-bold text-text-secondary mb-3">
                {user.email}
              </p>
              <div className="flex gap-2 mb-3">
                <span className="px-3 py-1 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {user.role || "User"}
                </span>
                <span className="px-3 py-1 bg-background-elevated text-text-primary border border-[var(--border-color-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {user.status || "Active"}
                </span>
              </div>

              {/* Network Stats: Followers / Following */}
              <div className="flex items-center gap-4 pt-3 border-t border-[var(--border-color-primary)]">
                <div>
                  <span className="text-text-primary font-black">
                    {user.followers.length || 248}
                  </span>{" "}
                  <span className="text-[9px] uppercase font-bold text-text-muted tracking-widest">
                    Followers
                  </span>
                </div>
                <div className="w-[1px] h-3 bg-[var(--border-color-primary)]"></div>
                <div>
                  <span className="text-text-primary font-black">
                    {user.following.length || 112}
                  </span>{" "}
                  <span className="text-[9px] uppercase font-bold text-text-muted tracking-widest">
                    Following
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Analytics Grid */}
          <div className="px-8 py-6 grid grid-cols-2 gap-4 bg-background-elevated border-y border-[var(--border-color-primary)]">
            {/* Streak Stat */}
            <div className="bg-background-soft p-4 rounded-2xl border border-[var(--border-color-primary)] shadow-sm flex items-center gap-4 group hover:border-primary/40 transition-colors">
              <div className="bg-accent-glow text-accent p-3 rounded-xl text-lg group-hover:scale-110 transition-transform">
                <FaFire />
              </div>
              <div>
                <p className="text-lg font-black text-text-primary tracking-tight">
                  {user.streak || 12}
                </p>
                <p className="text-[9px] uppercase font-black text-text-muted tracking-widest">
                  Day Streak
                </p>
              </div>
            </div>

            {/* Quiz Score Stat */}
            <div className="bg-background-soft p-4 rounded-2xl border border-[var(--border-color-primary)] shadow-sm flex items-center gap-4 group hover:border-primary/40 transition-colors">
              <div className="bg-success-glow text-success p-3 rounded-xl text-lg group-hover:scale-110 transition-transform">
                <FaQuestionCircle />
              </div>
              <div>
                <p className="text-lg font-black text-text-primary tracking-tight">
                  {user.quizScore || "88%"}
                </p>
                <p className="text-[9px] uppercase font-black text-text-muted tracking-widest">
                  Avg Quiz Score
                </p>
              </div>
            </div>

            {/* Problem Solving Breakdown (Full Width) */}
            <div className="col-span-2 bg-background-soft p-5 rounded-2xl border border-[var(--border-color-primary)] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                  <FaCode size={14} />
                </div>
                <div>
                  <p className="text-base font-black text-text-primary leading-none">
                    {user.solvedQuestions || 45}{" "}
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-widest ml-1">
                      Total Solved
                    </span>
                  </p>
                </div>
              </div>

              {/* Easy / Med / Hard Breakdown */}
              <div className="flex gap-2">
                <div className="flex flex-col items-center justify-center flex-1 bg-success-glow border border-[var(--border-color-primary)] rounded-xl py-2 group hover:bg-success/10 transition-colors">
                  <span className="text-success text-[9px] uppercase font-black tracking-widest">
                    Easy
                  </span>
                  <span className="text-text-primary font-black text-sm">
                    {user.easyCount || 20}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 bg-accent-glow border border-[var(--border-color-primary)] rounded-xl py-2 group hover:bg-accent/10 transition-colors">
                  <span className="text-accent text-[9px] uppercase font-black tracking-widest">
                    Med
                  </span>
                  <span className="text-text-primary font-black text-sm">
                    {user.mediumCount || 15}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 bg-danger-glow border border-[var(--border-color-primary)] rounded-xl py-2 group hover:bg-danger/10 transition-colors">
                  <span className="text-danger text-[9px] uppercase font-black tracking-widest">
                    Hard
                  </span>
                  <span className="text-text-primary font-black text-sm">
                    {user.hardCount || 10}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Note / Message Section */}
          <div className="p-8 bg-background-soft">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
              Admin Directives & Notes
            </h4>
            <div className="relative">
              <textarea
                rows="2"
                placeholder="Append a system note or direct message to this entity..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-background-elevated border border-[var(--border-color-primary)] rounded-2xl p-4 pr-14 text-xs font-bold text-text-primary placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none resize-none transition-all scrollbar-hide"
              ></textarea>
              <button
                onClick={handleSaveNote}
                disabled={!note.trim()}
                title="Save Note"
                className="absolute right-3 bottom-3 h-8 w-8 flex items-center justify-center rounded-xl bg-primary text-white disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 transition-all shadow-md shadow-primary/20"
              >
                <FaPaperPlane size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Timeline Info */}
        <div className="p-5 bg-background-elevated border-t border-[var(--border-color-primary)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[9px] font-black text-text-muted uppercase tracking-widest">
            <FaCalendarAlt className="text-primary" />
            Registered:{" "}
            <span className="text-text-secondary">
              {new Date(user.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-text-muted uppercase tracking-widest">
            <span
              className={`h-1.5 w-1.5 rounded-full ${user.status === "Active" ? "bg-success animate-pulse" : "bg-danger"}`}
            ></span>
            Last Login:{" "}
            <span className="text-text-secondary">
              {new Date(
                user.lastLogin || Date.now() - 3600000,
              ).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
