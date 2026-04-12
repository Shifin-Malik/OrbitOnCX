import React from "react";

const StatCard = ({ title, value, icon, color, bg, trend, isLive }) => {
  return (
    <div className="group relative bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] p-4 rounded-[1.8rem] transition-all duration-500 hover:-translate-y-1.5 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[var(--color-primary)]/10">
      {/* Background Glow */}
      <div
        className={`absolute -right-6 -top-6 w-24 h-24 ${bg} opacity-0 group-hover:opacity-20 blur-[40px] transition-opacity duration-700 pointer-events-none`}
      ></div>

      <div className="flex justify-between items-start relative z-10">
        <div
          className={`relative p-2.5 rounded-xl ${bg} ${color} border border-white/5 shadow-lg backdrop-blur-md transition-all duration-500 group-hover:scale-110`}
        >
          <span className="text-lg">{icon}</span>
        </div>

        {trend && (
          <span
            className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full border transition-all ${
              isLive
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse"
                : "bg-[var(--color-background-elevated)] border-[var(--border-color-primary)] text-[var(--text-color-muted)]"
            }`}
          >
            {isLive && (
              <span className="inline-block w-1 h-1 rounded-full bg-emerald-400 mr-1 animate-ping"></span>
            )}
            {trend}
          </span>
        )}
      </div>

      <div className="mt-4 relative z-10">
        <p className="text-[var(--text-color-muted)] text-[9px] font-black uppercase tracking-[0.2em] opacity-50">
          {title}
        </p>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-[var(--text-color-primary)] tracking-tighter group-hover:text-[var(--color-primary)] transition-colors">
            {value}
          </h3>

          {/* Mini Sparkline Graph */}
          <svg
            className="w-12 h-6 overflow-visible opacity-30 group-hover:opacity-100 transition-opacity"
            viewBox="0 0 40 20"
          >
            <path
              d="M0 15 Q 5 5, 10 12 T 20 8 T 30 14 T 40 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={color}
            />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-color-primary)] opacity-20">
        <div
          className={`h-full w-0 group-hover:w-full transition-all duration-700 ease-in-out ${bg.split(" ")[0]}`}
        ></div>
      </div>
    </div>
  );
};

export default StatCard;
