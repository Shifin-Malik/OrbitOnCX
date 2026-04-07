import React from "react";
import {
  FaCheckCircle,
  FaTerminal,
  FaLock,
} from "react-icons/fa";

const problems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    status: "solved",
    acceptance: "57.3%",
  },
  {
    id: 2,
    title: "Add Two Numbers",
    difficulty: "Medium",
    status: "attempted",
    acceptance: "48.2%",
  },
  {
    id: 3,
    title: "Longest Substring Without Repeating",
    difficulty: "Medium",
    status: "todo",
    acceptance: "38.8%",
    premium: true,
  },
  {
    id: 4,
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    status: "todo",
    acceptance: "46.2%",
  },
];

const ProblemList = ({ onSelectProblem }) => {
  return (
    <div className="w-full bg-[var(--color-background-elevated)]/20 rounded-xl overflow-hidden border border-[var(--border-color-primary)]/20">
      {/* Simple Header */}
      <div className="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-color-primary)]/10 text-[10px] font-bold uppercase tracking-wider text-white bg-[var(--color-primary)]">
        <div className="col-span-1">Status</div>
        <div className="col-span-7">Title</div>
        <div className="col-span-2 text-center">Difficulty</div>
        <div className="col-span-2 text-right">Acceptance</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--border-color-primary)]/5">
        {problems.map((prob) => (
          <div
            key={prob.id}
            onClick={() => onSelectProblem(prob)}
            className="grid grid-cols-12 items-center px-6 py-4 hover:bg-[var(--color-primary)]/[0.03] cursor-pointer transition-colors group"
          >
            {/* Status */}
            <div className="col-span-1">
              {prob.status === "solved" ? (
                <FaCheckCircle className="text-emerald-500 text-sm" />
              ) : prob.status === "attempted" ? (
                <FaTerminal className="text-amber-500 text-xs" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-color-muted)] opacity-20 ml-1"></div>
              )}
            </div>

            {/* Title */}
            <div className="col-span-7 flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--text-color-primary)] group-hover:text-[var(--color-primary)]">
                {prob.id}. {prob.title}
              </span>
              {prob.premium && <FaLock className="text-amber-400 text-[9px]" />}
            </div>

            {/* Difficulty */}
            <div className="col-span-2 text-center">
              <span
                className={`text-[10px] font-bold ${
                  prob.difficulty === "Easy"
                    ? "text-emerald-500"
                    : prob.difficulty === "Medium"
                      ? "text-amber-500"
                      : "text-rose-500"
                }`}
              >
                {prob.difficulty}
              </span>
            </div>

            {/* Acceptance */}
            <div className="col-span-2 text-right text-xs font-mono text-[var(--text-color-secondary)] opacity-70">
              {prob.acceptance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProblemList;
