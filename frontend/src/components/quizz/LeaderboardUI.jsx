import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FaStopwatch, FaTrophy, FaMedal, FaFire } from "react-icons/fa";

import {
  fetchLeaderboard,
  fetchUserHistory,
} from "../../features/quizz/quizzSlice.js";

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -15 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const getRankStyles = (rank) => {
  // Gold
  if (rank === 0) {
    return {
      row: "border-green-500/40 bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent shadow-[0_0_20px_rgba(234,179,8,0.1)] dark:border-green-400/50 dark:from-green-400/10 dark:shadow-[0_0_20px_rgba(250,204,21,0.15)]",
      rank: "text-green-600 drop-shadow-[0_0_8px_rgba(202,138,4,0.3)] dark:text-green-400 dark:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] text-[14px]",
      badge:
        "border-green-500/30 bg-green-500/10 text-green-600 dark:border-green-400/40 dark:bg-green-400/20 dark:text-green-300 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
    };
  }

  // Silver
  if (rank === 1) {
    return {
      row: "border-slate-400/40 bg-gradient-to-r from-slate-400/10 via-slate-400/5 to-transparent dark:border-slate-300/40 dark:from-slate-300/10",
      rank: "text-slate-500 drop-shadow-[0_0_8px_rgba(100,116,139,0.3)] dark:text-slate-200 dark:drop-shadow-[0_0_8px_rgba(203,213,225,0.8)] text-[13px]",
      badge:
        "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:border-slate-300/40 dark:bg-slate-300/20 dark:text-slate-200",
    };
  }

  // Bronze
  if (rank === 2) {
    return {
      row: "border-amber-600/30 bg-gradient-to-r from-amber-600/10 via-amber-600/5 to-transparent dark:border-amber-600/50 dark:from-amber-600/10",
      rank: "text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.3)] dark:text-amber-500 dark:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] text-[12px]",
      badge:
        "border-amber-600/30 bg-amber-600/10 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-400",
    };
  }

  // Others (Uses your native CSS theme variables)
  return {
    row: "border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] hover:border-[var(--color-primary)]/50",
    rank: "text-[var(--text-color-muted)]",
    badge:
      "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  };
};

const LeaderboardUI = ({ quizId, mode = "GLOBAL" }) => {
  const dispatch = useDispatch();

  const {
    leaderboard = [],
    loadingLeaderboard,
    error,
    history = [],
    loadingHistory,
  } = useSelector((state) => state.quiz);

  useEffect(() => {
    dispatch(fetchLeaderboard(quizId));
  }, [dispatch, quizId]);

  useEffect(() => {
    if (!history.length && !loadingHistory) dispatch(fetchUserHistory());
  }, [dispatch, history.length, loadingHistory]);

  const hasPlayedAnyQuiz = history.length > 0;
  const showUnlock =
    !hasPlayedAnyQuiz &&
    Array.isArray(leaderboard) &&
    leaderboard.length === 0 &&
    !loadingLeaderboard;

  return (
    <div className="w-full max-w-6xl mx-auto transition-all duration-500">
      {/* Header Area */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--color-primary)]/30 bg-[var(--color-background-soft)] shadow-[0_0_20px_var(--color-accent-green)] transition-colors duration-300">
            <FaTrophy
              className="text-[var(--color-primary)] drop-shadow-[0_0_10px_var(--color-accent-green)]"
              size={20}
            />
          </div>

          <div>
            <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-[var(--text-color-primary)] transition-colors duration-300">
              Leaderboard
            </h3>
            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--text-color-muted)] transition-colors duration-300">
              Top Warriors {quizId ? `(${leaderboard.length || 0})` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] shadow-inner transition-colors duration-300">
            {mode === "QUIZ" ? "Quiz Rank" : "Global Rank"}
          </span>

          {quizId && (
            <div className="rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)] transition-colors duration-300">
              {loadingLeaderboard ? (
                <span className="animate-pulse">Syncing...</span>
              ) : (
                `${leaderboard.length} Entries`
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {showUnlock ? (
        <div className="rounded-[2rem] border-2 border-dashed border-[var(--color-primary)]/30 bg-[var(--color-background-soft)] px-6 py-12 text-center shadow-[0_0_30px_var(--color-accent-green)] relative overflow-hidden group transition-colors duration-300">
          <div className="absolute inset-0 bg-[var(--color-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 shadow-[0_0_20px_var(--color-accent-green)]">
            <FaFire className="text-[var(--color-primary)]" size={24} />
          </div>
          <p className="text-[13px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]">
            Complete a mission to unlock
          </p>
          <p className="text-[10px] font-bold tracking-widest text-[var(--text-color-muted)] mt-2">
            The arena awaits your first deployment
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-green)] p-5 text-[var(--color-danger)] text-center shadow-[0_0_15px_var(--color-danger-green)] transition-colors duration-300">
          <p className="text-[12px] font-black uppercase tracking-widest">
            Connection Failed
          </p>
          <p className="text-[10px] mt-1 opacity-80">{String(error)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.6rem] border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] shadow-2xl transition-colors duration-300">
          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] px-5 py-4 transition-colors duration-300">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-color-muted)]">
              {mode === "QUIZ" ? "Mission Standings" : "World Rankings"}
            </p>

            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)] bg-[var(--color-background-soft)] px-3 py-1.5 rounded-lg border border-[var(--border-color-primary)] transition-colors duration-300">
              <FaStopwatch className="text-[var(--color-primary)]" size={10} />
              {mode === "QUIZ" ? "Tie-break: Time" : "Sort: Total XP"}
            </div>
          </div>

          {/* Leaderboard List */}
          {loadingLeaderboard ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-20 animate-pulse rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)]/50"
                />
              ))}
            </div>
          ) : Array.isArray(leaderboard) && leaderboard.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] transition-colors duration-300">
                <FaMedal
                  className="text-[var(--color-primary)] opacity-50"
                  size={20}
                />
              </div>
              <p className="text-[13px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]">
                No warriors found
              </p>
              <p className="text-[10px] text-[var(--text-color-muted)] mt-1 tracking-widest">
                Be the first to claim the throne
              </p>
            </div>
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="p-4 md:p-5"
            >
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => {
                  const styles = getRankStyles(idx);

                  return (
                    <motion.div
                      key={entry._id}
                      variants={rowVariants}
                      whileHover={{ scale: 1.01 }}
                      className={`flex items-center justify-between gap-4 rounded-[1.2rem] border px-4 py-3.5 transition-colors duration-300 ${styles.row}`}
                    >
                      <div className="flex min-w-0 items-center gap-4 md:gap-5">
                        {/* Rank Position */}
                        <div className="w-8 shrink-0 text-center flex items-center justify-center">
                          <span
                            className={`font-black italic uppercase ${styles.rank}`}
                          >
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Avatar */}
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-[var(--color-background-soft)] bg-[var(--color-background-elevated)] shadow-md transition-colors duration-300">
                          <img
                            alt={entry.user?.name || "Player"}
                            src={
                              entry.user?.avatar ||
                              "https://api.dicebear.com/7.x/avataaars/svg?seed=Orbiton"
                            }
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* User Details */}
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-black uppercase italic tracking-tight text-[var(--text-color-primary)]">
                            {entry.user?.name || "Unknown"}
                          </p>

                          <div className="mt-1 flex items-center gap-3">
                            {mode === "QUIZ" ? (
                              <div className="flex items-center gap-1.5 rounded-md bg-[var(--color-background-soft)] px-2 py-0.5 border border-[var(--border-color-primary)] transition-colors duration-300">
                                <FaStopwatch
                                  className="text-[var(--text-color-muted)]"
                                  size={8}
                                />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-color-secondary)]">
                                  {entry.timeTaken ?? "—"}s
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 rounded-md bg-[var(--color-background-soft)] px-2 py-0.5 border border-[var(--border-color-primary)] transition-colors duration-300">
                                <FaFire
                                  className="text-[var(--color-accent)]"
                                  size={8}
                                />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-color-secondary)]">
                                  {entry.missions ?? "—"} Missions
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats Section */}
                      <div className="flex shrink-0 items-center gap-3">
                        {/* Primary Stat (Score/Total XP) */}
                        <div
                          className={`flex flex-col items-center justify-center rounded-xl border px-4 py-2 min-w-[70px] ${styles.badge}`}
                        >
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">
                            {mode === "QUIZ" ? "Score" : "Total XP"}
                          </p>
                          <p className="mt-0.5 text-[14px] font-black italic tracking-tighter">
                            {mode === "QUIZ"
                              ? `${entry.score ?? 0}`
                              : `+${entry.totalXp ?? 0}`}
                          </p>
                        </div>

                        {/* Secondary Stat (XP Gained/Last Date) - Hidden on very small screens */}
                        <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] px-4 py-2 min-w-[70px] transition-colors duration-300">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)]">
                            {mode === "QUIZ" ? "XP Gained" : "Last Entry"}
                          </p>
                          <p className="mt-0.5 text-[11px] font-black text-[var(--text-color-secondary)]">
                            {mode === "QUIZ"
                              ? `+${entry.xpGained ?? 0}`
                              : String(entry.lastCompletedAt || "—").slice(
                                  0,
                                  10,
                                )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardUI;
