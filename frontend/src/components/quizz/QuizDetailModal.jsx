import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTimes, FaSkull } from "react-icons/fa";

import {
  fetchQuizDetails,
  startQuiz,
} from "../../features/quizz/quizzSlice.js";

const DIFFICULTIES = ["Easy", "Medium", "Advanced"];

const QuizDetailModal = ({ quizId, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { quizDetails, loadingDetails, startingBattle, error } = useSelector(
    (state) => state.quiz,
  );

  const [difficulty, setDifficulty] = useState("Medium");

  useEffect(() => {
    if (quizId) dispatch(fetchQuizDetails(quizId));
  }, [dispatch, quizId]);

  const quiz = useMemo(() => {
    if (quizDetails?._id === quizId) return quizDetails;
    return null;
  }, [quizDetails, quizId]);

  const handleLaunch = async () => {
    if (!quiz) return;

    const result = await dispatch(
      startQuiz({
        quizId: quiz._id,
        difficulty,
        limit: 10,
        customTimeLimit: quiz.timeLimit,
      }),
    );

    

    if (result.meta.requestStatus === "fulfilled") {
      onClose?.();
      navigate(`/quiz-arena/${quiz._id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-4">
      <motion.button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-[460px] overflow-hidden rounded-[2rem] border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] shadow-[0_0_24px_var(--color-accent-glow)] transition-colors duration-300"
      >
        <div className="border-b border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--text-color-muted)]">
                Mission Brief
              </p>

              <h3 className="mt-1.5 truncate text-xl font-black italic uppercase tracking-tight text-[var(--text-color-primary)] md:text-2xl">
                {loadingDetails ? "Loading..." : quiz?.title || "Unknown"}
              </h3>

              <p className="mt-2 text-[11px] font-medium leading-relaxed text-[var(--text-color-secondary)]">
                {quiz?.description || "No description provided."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] text-[var(--text-color-secondary)] transition-colors hover:text-[var(--color-primary)]"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-4 md:p-5">
          {error && (
            <div className="rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] p-3 text-[var(--text-color-secondary)]">
              <p className="text-[10px] font-bold">{String(error)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[var(--text-color-muted)]">
                Category
              </p>
              <p className="mt-1.5 text-[11px] font-black uppercase italic text-[var(--text-color-primary)]">
                {quiz?.category || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[var(--text-color-muted)]">
                Questions
              </p>
              <p className="mt-1.5 text-[11px] font-black uppercase italic text-[var(--text-color-primary)]">
                {quiz?.totalQuestions ?? "—"}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[var(--text-color-muted)]">
                Time Limit
              </p>
              <p className="mt-1.5 text-[11px] font-black uppercase italic text-[var(--text-color-primary)]">
                {quiz?.timeLimit ? `${quiz.timeLimit}s` : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[var(--text-color-muted)]">
                XP Potential
              </p>
              <p className="mt-1.5 text-[11px] font-black uppercase italic text-[var(--text-color-primary)]">
                {quiz?.xpPotential ?? "—"}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[9px] font-black uppercase tracking-[0.28em] text-[var(--text-color-muted)]">
              Difficulty
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {DIFFICULTIES.map((d) => {
                const isActive = difficulty === d;

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-wide transition-colors duration-300 ${
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-[0_0_12px_var(--color-accent-glow)]"
                        : "border-[var(--border-color-primary)] bg-[var(--color-background-soft)] text-[var(--text-color-secondary)] hover:border-[var(--color-primary)]/60"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunch}
            disabled={!quiz || loadingDetails || startingBattle}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-3 text-[11px] font-black italic uppercase tracking-[0.2em] text-[var(--color-background)] shadow-[0_0_18px_var(--color-accent-glow)] transition-colors duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {startingBattle ? "Launching..." : "Launch Battle"}
            <FaSkull size={11} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizDetailModal;
