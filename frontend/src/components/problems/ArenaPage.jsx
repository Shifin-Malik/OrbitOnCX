import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown,
  FaCode,
  FaFire,
  FaTrophy,
} from "react-icons/fa";
import ProblemList from "./ProblemList";
import ProblemCompiler from "./ProblemCompiler";

const ArenaPage = () => {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  

  const filters = ["All", "Easy", "Medium", "Hard"];

  

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--text-color-primary)] transition-colors duration-500">
      <AnimatePresence mode="wait">
        {!selectedProblem ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-6xl mx-auto px-6 py-24"
          >
            {/* Header Section */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-black tracking-tighter italic flex items-center gap-3">
                  <FaCode className="text-[var(--color-primary)]" />
                  ORBITON<span className="text-[var(--color-primary)]">CX</span>
                </h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--text-color-muted)] mt-1">
                  Master the logic, Conquer the arena
                </p>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {/* 1. Solved Rate */}
              <div className="p-4 rounded-xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] shadow-sm">
                <div className="flex items-center gap-2 text-[var(--text-color-muted)] text-[8px] font-black uppercase mb-2">
                  <FaTrophy className="text-amber-500" /> Solved
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[var(--text-color-primary)]">
                    12
                  </span>
                  <span className="text-[10px] text-[var(--text-color-muted)] font-bold">
                    / 45
                  </span>
                </div>
                <div className="w-full h-1 bg-[var(--color-background-elevated)] rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[var(--color-primary)] w-[26%] shadow-[0_0_8px_var(--color-primary)]"></div>
                </div>
              </div>

              {/* 2. Streak */}
              <div className="p-4 rounded-xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] shadow-sm">
                <div className="flex items-center gap-2 text-[var(--text-color-muted)] text-[8px] font-black uppercase mb-2">
                  <FaFire className="text-orange-500" /> Streak
                </div>
                <div className="text-2xl font-black text-[var(--text-color-primary)]">
                  05{" "}
                  <span className="text-[10px] font-bold text-[var(--text-color-muted)] uppercase">
                    Days
                  </span>
                </div>
              </div>

              {/* 3. XP / Rank */}
              <div className="p-4 rounded-xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-accent-glow)]">
                <div className="text-[8px] font-black uppercase opacity-80 mb-2">
                  Global Rank
                </div>
                <div className="text-2xl font-black">#1,248</div>
                <div className="text-[9px] mt-1 font-bold opacity-90">
                  1,240 XP Collected
                </div>
              </div>

              {/* 4. New: Recent Performance / Skill */}
              <div className="p-4 rounded-xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] shadow-sm border-l-4 border-l-[var(--color-primary)]">
                <div className="text-[8px] font-black uppercase text-[var(--text-color-muted)] mb-2">
                  Skill Level
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-[var(--text-color-primary)]">
                    Intermediate
                  </span>
                </div>
                <p className="text-[9px] text-[var(--color-primary)] font-bold mt-1 uppercase tracking-tighter">
                  Top 15% of Developers
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-4 bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:border-[var(--color-primary)] transition-all"
                >
                  <span
                    className={
                      activeFilter === "Easy"
                        ? "text-emerald-500"
                        : activeFilter === "Medium"
                          ? "text-amber-500"
                          : activeFilter === "Hard"
                            ? "text-rose-500"
                            : ""
                    }
                  >
                    {activeFilter === "All"
                      ? "Select Difficulty"
                      : activeFilter}
                  </span>
                  <FaChevronDown
                    className={`text-[9px] opacity-40 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isFilterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                    {filters.map((f) => (
                      <div
                        key={f}
                        onClick={() => {
                          setActiveFilter(f);
                          setIsFilterOpen(false);
                        }}
                        className="px-5 py-3 text-xs font-semibold cursor-pointer hover:bg-[var(--color-background-elevated)] transition-colors border-b border-[var(--border-color-secondary)] last:border-0 text-[var(--text-color-secondary)]"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 bg-[var(--color-background-elevated)] p-1 rounded-xl">
                {["Todo", "Solved"].map((s) => (
                  <button
                    key={s}
                    className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter text-[var(--text-color-muted)] hover:text-[var(--text-color-primary)] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Table Wrapper */}
            <div className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-3xl overflow-hidden shadow-sm">
              <ProblemList
                activeFilter={activeFilter}
                onSelectProblem={(prob) => setSelectedProblem(prob)}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="compiler"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
          >
            <ProblemCompiler
              problem={selectedProblem}
              onBack={() => setSelectedProblem(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArenaPage;
