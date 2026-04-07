import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineLightningBolt } from "react-icons/hi";
import { fetchAllQuizzes } from "../../features/quizz/quizzSlice.js";
import QuizDetailModal from "./QuizDetailModal.jsx";

const QuizList = () => {
  const dispatch = useDispatch();
  const {
    quizzes = [],
    loadingQuizzes = false,
    error,
  } = useSelector((state) => state.quiz);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  useEffect(() => {
    dispatch(fetchAllQuizzes());
  }, [dispatch]);

  const filteredQuizzes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return quizzes;
    return quizzes.filter((q) => q.title?.toLowerCase().includes(term));
  }, [quizzes, searchTerm]);

  // Difficulty Color Mapping
  const getDifficultyStyles = (level) => {
    const diff = level?.toLowerCase();
    if (diff === "easy")
      return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (diff === "medium")
      return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-red-400 border-red-500/30 bg-red-500/10"; // Hard
  };

  return (
    <div className="w-full transition-all duration-500">
      {/* Header Section with Search */}
      <div className="flex w-full justify-center items-center gap-6 mb-10">
        <div className="relative">
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-[var(--text-color-primary)] leading-tight">
            Select Your
            <span className="text-[var(--color-primary)] drop-shadow-[0_0_25px_var(--color-accent-glow)]">
              Battlefield
            </span>
          </h2>
        </div>
      </div>

      {loadingQuizzes ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="h-[240px] rounded-[2.5rem] border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {filteredQuizzes.map((quiz) => (
            <motion.button
              layout
              key={quiz._id}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedQuizId(quiz._id)}
              className="relative text-left group overflow-hidden rounded-[2.2rem] border border-[var(--border-color-primary)] bg-[var(--color-background-soft)]/40 backdrop-blur-sm p-6 transition-all duration-500 hover:border-[var(--color-primary)]/50 shadow-[0_0_0px_transparent] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              {/* Background Decorative Element */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-primary)]/5 blur-3xl group-hover:bg-[var(--color-primary)]/20 transition-all duration-700" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] p-2 shadow-inner overflow-hidden group-hover:shadow-[0_0_15px_var(--color-accent-glow)] transition-all">
                    <img
                      src={quiz.thumbnail}
                      alt=""
                      className="w-full h-full object-contain filter group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-tighter ${getDifficultyStyles(quiz.difficulty)}`}
                  >
                    {quiz.difficulty}
                  </div>
                </div>

                <h3 className="text-[12px] font-black uppercase italic tracking-tight text-[var(--text-color-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                  {quiz.title}
                </h3>

                <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[var(--text-color-muted)] mt-1 opacity-70">
                  Sector: {quiz.category}
                </p>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-black text-[var(--text-color-secondary)] uppercase tracking-widest bg-[var(--color-background-elevated)] px-6 py-2 rounded-xl border border-[var(--border-color-primary)]">
                    <HiOutlineLightningBolt className="text-[var(--color-primary)]" />
                    {quiz.totalQuestions} Questions
                  </div>
                </div>
              </div>

              {/* Bottom Glow Line */}
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--color-primary)] group-hover:w-full transition-all duration-500 shadow-[0_0_15px_var(--color-primary)]" />
            </motion.button>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedQuizId && (
          <QuizDetailModal
            quizId={selectedQuizId}
            onClose={() => setSelectedQuizId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizList;
