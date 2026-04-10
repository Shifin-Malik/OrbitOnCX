import React from "react";
import {
  FaTimes,
  FaFingerprint,
  FaCode,
  FaQuestionCircle,
  FaUserShield,
  FaBan,
  FaChartLine,
  FaEnvelope,
} from "react-icons/fa";

const UserDetailSidebar = ({ user, onClose }) => {
  if (!user) return null;

  // Placeholder cells for Heatmap Grid
  const heatmapData = Array.from({ length: 35 });

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md h-full bg-[#050a0a] border-l border-[var(--color-primary)]/20 shadow-[-30px_0_60px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-transparent to-[var(--color-primary)]/5">
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">
              NODE_INTEL
            </h3>
            <p className="text-[9px] font-bold text-[var(--color-primary)] tracking-[0.3em] uppercase">
              Security Level: Authorized
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white border border-white/10 transition-all"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Central Profile Card */}
          <div className="relative p-8 bg-[#0d1616] border border-white/5 rounded-[3rem] text-center overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform">
              <FaFingerprint size={60} />
            </div>

            {/* Rank Badge */}
            <div className="absolute top-6 left-6 px-3 py-1 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-full">
              <p className="text-[9px] font-black text-[var(--color-primary)]">
                RANK #{user.rank || "N/A"}
              </p>
            </div>

            <div className="h-28 w-28 rounded-[2rem] bg-black/40 border-2 border-[var(--color-primary)]/30 flex items-center justify-center text-5xl font-black text-[var(--color-primary)] mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              {user.name.charAt(0)}
            </div>

            <h4 className="text-xl font-black uppercase tracking-tight leading-none mb-2">
              {user.name}
            </h4>
            <p className="text-[11px] font-medium text-white/30 uppercase tracking-[0.2em] mb-4">
              {user.email}
            </p>

            <div className="flex justify-center gap-2">
              <span
                className={`text-[9px] font-black px-3 py-1 rounded bg-white/5 border border-white/10 ${user.isVerified ? "text-emerald-500" : "text-orange-500"} uppercase tracking-tighter`}
              >
                {user.isVerified
                  ? "✓ Verified Entity"
                  : "⚠ Verification Pending"}
              </span>
            </div>
          </div>

          {/* Activity Heatmap Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 italic">
                Node Consistency
              </p>
              <p className="text-[9px] font-bold text-emerald-500 uppercase">
                Active Status
              </p>
            </div>
            <div className="grid grid-cols-7 gap-2 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
              {heatmapData.map((_, i) => (
                <div
                  key={i}
                  className={`h-3.5 w-3.5 rounded-sm transition-all duration-500 ${i % 6 === 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : i % 3 === 0 ? "bg-emerald-500/30" : "bg-white/5"}`}
                ></div>
              ))}
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[var(--color-primary)]/30 transition-all">
              <FaChartLine
                className="text-[var(--color-primary)] mb-3"
                size={18}
              />
              <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">
                Quiz Accuracy
              </p>
              <p className="text-2xl font-black text-white">
                84.2<span className="text-sm opacity-30">%</span>
              </p>
            </div>
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all">
              <FaCode className="text-blue-500 mb-3" size={18} />
              <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">
                Compiler Usage
              </p>
              <p className="text-2xl font-black text-white">
                {user.solvedQuestions || 0}
              </p>
            </div>
          </div>

          {/* Critical Directives */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-1 italic">
              Administrative Directives
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all group">
                <FaBan className="group-hover:animate-pulse" />{" "}
                {user.status === "Active" ? "Terminate Node" : "Reactivate"}
              </button>
              <button className="flex items-center justify-center gap-2 py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase text-blue-400 hover:bg-blue-500 hover:text-white transition-all">
                <FaUserShield /> Promote Role
              </button>
            </div>
            <p className="text-[9px] text-white/30 italic px-2 bg-white/5 py-2 rounded-lg border-l-2 border-red-500/50">
              * Terminating this node will dispatch an automated security alert
              to <b>{user.email}</b> and revoke compiler access.
            </p>
          </div>

          {/* Dispatch Messenger */}
          <div className="space-y-4 pb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-1 italic">
              Manual Override Message
            </p>
            <textarea
              placeholder="Enter system notification details..."
              className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-[12px] font-medium text-white h-32 focus:outline-none focus:border-[var(--color-primary)]/50 transition-all resize-none shadow-inner placeholder:text-white/10"
            ></textarea>
            <button className="w-full py-5 bg-gradient-to-r from-[var(--color-primary)] to-emerald-800 text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-3xl shadow-[0_15px_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all">
              Broadcast Directive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailSidebar;
