import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  HiChevronLeft,
  HiOutlineChartBar,
  HiOutlineChip,
  HiOutlineDatabase,
  HiOutlineFingerPrint,
  HiOutlineLightningBolt,
  HiOutlineTerminal,
} from "react-icons/hi";

import QuizList from "./QuizList.jsx";
import Leaderboard from "./Leaderboard.jsx";
import QuizHistory from "./QuizHistory.jsx";

const QuizDash = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("quizzes");
  const navigate = useNavigate();

  const tabs = [
    { id: "quizzes", label: "Solo Ops", icon: HiOutlineTerminal },
    { id: "leaderboard", label: "Rank", icon: HiOutlineChartBar },
    { id: "history", label: "Logs", icon: HiOutlineDatabase },
  ];

  const handleBackNavigation = () => {
    if (onBack) onBack();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-background)] overflow-y-auto antialiased transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[320px] bg-[var(--color-primary)]/5 blur-[90px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <header className="flex items-center justify-between py-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleBackNavigation}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <HiChevronLeft size={14} />
            Exit_Module
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <h1 className="text-lg font-black tracking-tighter uppercase text-[var(--text-color-primary)] leading-none">
                ORBITON<span className="text-[var(--color-primary)]">CX</span>
              </h1>
              <span className="text-[8px] font-bold uppercase tracking-[0.35em] text-[var(--text-color-muted)]">
                Solo_Unit
              </span>
            </div>
            <HiOutlineFingerPrint
              className="text-[var(--color-primary)] opacity-40"
              size={18}
            />
          </div>
        </header>

        <div className="flex justify-center mb-8">
          <nav className="inline-flex p-1 bg-[var(--color-background-soft)]/80 backdrop-blur-xl rounded-2xl border border-[var(--border-color-primary)] shadow-[0_0_18px_var(--color-accent-glow)]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-300 z-10 ${
                    isActive
                      ? "text-[var(--color-background)]"
                      : "text-[var(--text-color-muted)] hover:text-[var(--text-color-primary)]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tabGlow"
                      className="absolute inset-0 bg-[var(--color-primary)] rounded-xl -z-10 shadow-[0_0_18px_var(--color-accent-glow)]"
                    />
                  )}
                  <Icon
                    size={14}
                    className={
                      isActive
                        ? "text-[var(--color-background)]"
                        : "text-[var(--color-primary)]/50"
                    }
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <main className="min-h-[360px] mb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "quizzes" && <QuizList />}
              {activeTab === "leaderboard" && <Leaderboard />}
              {activeTab === "history" && <QuizHistory />}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="py-10 flex flex-col items-center gap-2 border-t border-[var(--border-color-primary)]/20">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5 text-[8px] font-bold text-[var(--text-color-muted)] opacity-40 uppercase tracking-[0.1em]">
              <HiOutlineChip size={12} /> Mode: Standalone
            </span>
            <span className="flex items-center gap-1.5 text-[8px] font-bold text-[var(--text-color-muted)] opacity-40 uppercase tracking-[0.1em]">
              <HiOutlineLightningBolt size={12} /> Sync: Optimal
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default QuizDash;
