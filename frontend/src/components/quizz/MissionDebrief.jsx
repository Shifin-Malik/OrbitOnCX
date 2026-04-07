import React from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaBolt, FaHome, FaRedo, FaTrophy } from "react-icons/fa";

import { clearBattle, clearResults, startQuiz } from "../../features/quizz/quizzSlice.js";

const rankLabel = (rank) => {
  if (!rank) return "FAILED_PROTOCOL";
  return `${String(rank).toUpperCase()}_PROTOCOL`;
};

const MissionDebrief = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { results, activeBattle, submitting } = useSelector((state) => state.quiz);

  if (!results) return null;

  const correctAnswers = results.correctAnswers ?? 0;
  const wrongAnswers = results.wrongAnswers ?? 0;
  const total = correctAnswers + wrongAnswers;
  const percentage = Math.round((results.percentage ?? results.score ?? 0) * 100) / 100;
  const xpGained = results.xpGained ?? 0;
  const rank = results.rank || "FAILED";
  const globalRank = results.globalRank;
  const totalParticipants = results.totalParticipants;

  const handlePlayAgain = async () => {
    if (!activeBattle?.quizId) return;
    dispatch(clearResults());
    const res = await dispatch(
      startQuiz({
        quizId: activeBattle.quizId,
        difficulty: activeBattle.selectedDifficulty || "Medium",
        limit: 10,
        customTimeLimit: activeBattle.customTimeLimit || activeBattle.timeLimit,
      }),
    );
    if (res.meta.requestStatus === "fulfilled") {
      navigate(`/quiz-arena/${activeBattle.quizId}`);
    }
  };

  const handleExit = () => {
    dispatch(clearBattle());
    navigate("/quiz");
  };

  return (
    <div className="w-full flex items-center justify-center p-4 transition-all duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-[560px] rounded-[2rem] border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] overflow-hidden shadow-[0_0_28px_var(--color-accent-glow)] transition-all duration-300"
      >
        <div className="p-4 md:p-6 border-b border-[var(--border-color-primary)] bg-[var(--color-background-elevated)]">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--text-color-muted)]">
                Result Summary
              </p>
              <h2 className="mt-2 text-xl font-black italic uppercase tracking-tighter text-[var(--text-color-primary)]">
                Mission_Debrief
              </h2>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-color-muted)] truncate">
                {activeBattle?.title || "Battle"} • {activeBattle?.category || "—"}
              </p>
            </div>

            <div className="shrink-0 px-4 py-2 rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 shadow-[0_0_18px_var(--color-accent-glow)]">
              <div className="flex items-center gap-2">
                <FaTrophy className="text-[var(--color-primary)]" size={14} />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)]">
                  {rank}
                </span>
              </div>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--text-color-muted)]">
                {rankLabel(rank)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)]">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--text-color-muted)]">
                Performance
              </p>
              <p className="mt-2 text-2xl font-black italic text-[var(--text-color-primary)]">
                {percentage}%
              </p>
              <p className="mt-2 text-[11px] font-bold text-[var(--text-color-secondary)]">
                {correctAnswers}/{total} correct • {wrongAnswers} wrong
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)]">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--text-color-muted)]">
                XP Gained
              </p>
              <div className="mt-2 flex items-center gap-3">
                <FaBolt className="text-[var(--color-primary)]" size={14} />
                <p className="text-2xl font-black italic text-[var(--text-color-primary)]">
                  +{xpGained}
                </p>
              </div>
              <p className="mt-2 text-[11px] font-bold text-[var(--text-color-secondary)]">
                Logged to profile XP
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)]">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--text-color-muted)]">
                Global Standing
              </p>
              <p className="mt-2 text-[18px] font-black italic uppercase tracking-tighter text-[var(--color-primary)]">
                GLOBAL STANDING: #{globalRank ?? "—"}
              </p>
              <p className="mt-1 text-[12px] font-black italic uppercase tracking-tighter text-[var(--text-color-primary)]">
                / {totalParticipants ?? "—"} WARRIORS
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={handlePlayAgain}
              disabled={submitting}
              className="flex-1 px-6 py-3.5 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-background)] text-[10px] font-black italic uppercase tracking-[0.35em] transition-all duration-300 hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-3 shadow-[0_0_18px_var(--color-accent-glow)]"
            >
              Play Again
              <FaRedo size={12} />
            </button>

            <button
              type="button"
              onClick={handleExit}
              className="flex-1 px-6 py-3.5 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] text-[10px] font-black italic uppercase tracking-[0.35em] text-[var(--text-color-secondary)] transition-all duration-300 hover:border-[var(--color-primary)]/60 flex items-center justify-center gap-3"
            >
              Exit
              <FaHome size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MissionDebrief;
