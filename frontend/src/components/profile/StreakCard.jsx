import React from "react";
import { FaFire } from "react-icons/fa";

const StreakCard = ({ streak }) => {
  return (
    <div className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-[3rem] p-8 shadow-xl">
      <header className="flex items-center gap-4 mb-6">
        <span className="w-2.5 h-10 bg-[var(--color-primary)] rounded-full" />
        <h3 className="text-2xl font-black uppercase tracking-tighter">
          Streak
        </h3>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
              Current
            </div>
            <div className="text-4xl font-black mt-2">
              {streak?.current ?? 0}
            </div>
          </div>
          <FaFire className="text-orange-500 text-3xl" />
        </div>

        <div className="p-6 rounded-3xl bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)]">
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
            Longest
          </div>
          <div className="text-4xl font-black mt-2">
            {streak?.longest ?? 0}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-color-muted)] mt-3">
            Last solve: {streak?.lastSolvedDayKey || "—"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StreakCard);

