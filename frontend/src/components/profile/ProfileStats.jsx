import React from "react";
import ModernBar from "./ModernBar";

const ProfileStats = ({ user }) => {
  const solved = user?.stats?.totalSolved || 1000;
  const total = 3865;
  const offset = 502 - 502 * (solved / total);

  const items = [
    {
      label: "Easy",
      solved: user?.stats?.easySolved || 1000,
      total: 930,
      color: "bg-emerald-400",
    },
    {
      label: "Medium",
      solved: user?.stats?.mediumSolved || 1000,
      total: 2022,
      color: "bg-amber-400",
    },
    {
      label: "Hard",
      solved: user?.stats?.hardSolved || 700,
      total: 913,
      color: "bg-rose-400",
    },
  ];

  return (
    <section className="bg-background-soft border border-primary/20 rounded-[3rem] p-8 md:p-12 shadow-xl relative overflow-hidden">
      <header className="flex items-center gap-4 mb-12">
        <span className="w-2.5 h-10 bg-primary rounded-full" />
        <h3 className="text-2xl font-black uppercase tracking-tighter">
          Performance Overview
        </h3>
      </header>

      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="relative flex justify-center scale-110 md:scale-125">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-background-elevated"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray="502"
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black">{solved}</span>
            <span className="text-[10px] font-black uppercase opacity-40 mt-1">
              Solved
            </span>
          </div>
        </div>
        <div className="space-y-7">
          {items.map((item) => (
            <ModernBar key={item.label} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(ProfileStats);
