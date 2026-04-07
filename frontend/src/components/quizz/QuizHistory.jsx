import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FaHistory, FaTrophy } from "react-icons/fa";

import { fetchUserHistory } from "../../features/quizz/quizzSlice.js";

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const QuizHistory = () => {
  const dispatch = useDispatch();
  const { history = [], loadingHistory, error } = useSelector(
    (state) => state.quiz,
  );

  useEffect(() => {
    dispatch(fetchUserHistory());
  }, [dispatch]);

  const rows = useMemo(() => {
    return history.slice(0, 3).map((attempt, idx) => {
      const quiz = attempt.quizId || {};
      return {
        id: attempt._id,
        attemptNo: idx + 1,
        title: quiz.title || "Unknown",
        category: quiz.category || "—",
        score: attempt.score ?? 0,
        rank: attempt.rank || "—",
        xp: attempt.xpGained ?? 0,
        completedAt: attempt.completedAt || attempt.createdAt,
      };
    });
  }, [history]);

  return (
    <div className="w-full transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] flex items-center justify-center shadow-[0_0_16px_var(--color-accent-glow)]">
          <FaHistory className="text-[var(--color-primary)]" size={14} />
        </div>
        <div>
          <h3 className="text-lg font-black italic uppercase tracking-tighter text-[var(--text-color-primary)]">
            Battle Logs
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--text-color-muted)]">
            Attempts • dates • ranks
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] text-[var(--text-color-secondary)]">
          <p className="text-[11px] font-bold">{String(error)}</p>
        </div>
      )}

      <div className="rounded-[2rem] border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] overflow-hidden shadow-[0_0_26px_var(--color-accent-glow)]">
        <div className="px-5 py-3.5 border-b border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--text-color-muted)]">
            Recent
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
            {loadingHistory ? "Syncing..." : `${rows.length}/3 attempts`}
          </p>
        </div>

        {loadingHistory ? (
          <div className="p-5">
            <div className="h-20 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] animate-pulse" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[12px] font-bold text-[var(--text-color-secondary)]">
              No completed attempts yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color-primary)]">
            {rows.map((row, idx) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-[var(--color-primary)]/[0.03] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] text-[9px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                      Attempt {row.attemptNo}/3
                    </span>
                    <h4 className="text-[13px] font-black uppercase italic tracking-tight text-[var(--text-color-primary)] truncate">
                      {row.title}
                    </h4>
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-color-muted)]">
                    {row.category} • {formatDateTime(row.completedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)]">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[var(--text-color-muted)]">
                      Score
                    </p>
                    <p className="mt-1 text-[12px] font-black text-[var(--text-color-primary)]">
                      {row.score}%
                    </p>
                  </div>

                  <div className="px-3.5 py-2 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)]">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[var(--text-color-muted)]">
                      XP
                    </p>
                    <p className="mt-1 text-[12px] font-black text-[var(--text-color-primary)]">
                      +{row.xp}
                    </p>
                  </div>

                  <div className="px-3.5 py-2 rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 shadow-[0_0_14px_var(--color-accent-glow)]">
                    <div className="flex items-center gap-2">
                      <FaTrophy
                        className="text-[var(--color-primary)]"
                        size={12}
                      />
                      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)]">
                        {row.rank}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHistory;

