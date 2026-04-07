import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaClock, FaSkull } from "react-icons/fa";

import { startQuiz, submitQuiz } from "../../features/quizz/quizzSlice.js";

const REVIEW_MS = 700;

const QuizArena = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isSubmittingRef = useRef(false);
  const answersRef = useRef({});

  const { activeBattle, results, startingBattle, submitting, error } =
    useSelector((state) => state.quiz);

  const battle =
    activeBattle && String(activeBattle.quizId) === String(quizId)
      ? activeBattle
      : null;

  // 1. Logic to Sort Questions (Easy -> Medium -> Hard) and Shuffle Options
  const processedQuestions = useMemo(() => {
    if (!battle?.questions) return [];

    const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3, Advanced: 3 };

    return [...battle.questions]
      .sort(
        (a, b) =>
          (difficultyOrder[a.difficulty] || 1) -
          (difficultyOrder[b.difficulty] || 1),
      )
      .map((q) => {
        
        const optionsWithCorrect = q.options.map((opt) => ({
          text: opt,
          isCorrect: opt === q.correctAnswer,
        }));

        const shuffled = optionsWithCorrect.sort(() => Math.random() - 0.5);

        return {
          ...q,
          options: shuffled.map((o) => o.text),
          // We update the correct answer index based on the new shuffle if needed,
          // but since your logic uses text comparison for review, we'll keep it consistent.
        };
      });
  }, [battle?.questions]);

  const questions = processedQuestions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersByIndex, setAnswersByIndex] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [review, setReview] = useState(null);

  const totalAllowedTime = useMemo(() => {
    return battle?.customTimeLimit || battle?.timeLimit || 600;
  }, [battle?.customTimeLimit, battle?.timeLimit]);

  useEffect(() => {
    if (!quizId || results || isFinished || (battle && questions.length))
      return;
    dispatch(startQuiz({ quizId, difficulty: "Medium" }));
  }, [dispatch, quizId, battle, questions.length, results, isFinished]);

  useEffect(() => {
    if (!questions.length) return;
    setCurrentIndex(0);
    setAnswersByIndex({});
    answersRef.current = {};
    setIsFinished(false);
    setReview(null);
    setTimeLeft(totalAllowedTime);
    isSubmittingRef.current = false;
  }, [quizId, questions.length, totalAllowedTime]);

  const handleFinish = useCallback(
    async (finalAnswers) => {
      if (isSubmittingRef.current || isFinished || !quizId || !questions.length)
        return;

      isSubmittingRef.current = true;
      const answers = finalAnswers || answersRef.current;
      const timeTakenInSeconds = Math.max(
        0,
        totalAllowedTime - (timeLeft || 0),
      );

      const submissionData = {
        quizId,
        userAnswers: questions.map((q, index) => ({
          questionId: q._id,
          selectedOptionText:
            answers[index] !== undefined ? q.options[answers[index]] : null,
        })),
        timeTaken: timeTakenInSeconds,
      };

      try {
        await dispatch(submitQuiz(submissionData)).unwrap();
        setIsFinished(true);
      } catch {
        isSubmittingRef.current = false;
      }
    },
    [dispatch, isFinished, questions, quizId, timeLeft, totalAllowedTime],
  );

  useEffect(() => {
    if (
      timeLeft === null ||
      startingBattle ||
      isFinished ||
      results ||
      questions.length === 0
    )
      return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(
      () => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, [
    timeLeft,
    startingBattle,
    questions.length,
    isFinished,
    results,
    handleFinish,
  ]);

  useEffect(() => {
    if (results && isFinished && !review) navigate("/mission-debrief");
  }, [results, isFinished, review, navigate]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  const selectOption = (optionIndex) => {
    if (isFinished || results || !currentQuestion || review) return;

    const correctText = currentQuestion.correctAnswer;
    const correctIndex = currentQuestion.options.indexOf(correctText);
    const isCorrect = optionIndex === correctIndex;

    const nextAnswers = { ...answersRef.current, [currentIndex]: optionIndex };
    answersRef.current = nextAnswers;
    setAnswersByIndex(nextAnswers);

    setReview({
      selectedIndex: optionIndex,
      correctIndex,
      isCorrect,
      correctAnswer: correctText,
    });

    window.setTimeout(() => {
      setReview(null);
      if (currentIndex >= questions.length - 1) {
        handleFinish(nextAnswers);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, REVIEW_MS);
  };

  const counts = useMemo(() => {
    return questions.reduce((acc, q) => {
      const diff = q.difficulty || "Unknown";
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    }, {});
  }, [questions]);

  const easyCount = counts["Easy"] || 0;
  const mediumCount = counts["Medium"] || 0;
  const hardCount = (counts["Hard"] || 0) + (counts["Advanced"] || 0);
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--text-color-primary)]">
      <div className="mx-auto max-w-4xl px-3 py-4 md:px-4 md:py-5">
        {/* Header Section */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]"
          >
            <FaArrowLeft size={10} /> Exit
          </button>

          {/* Difficulty Indicators at Top */}
          {/* Difficulty Indicators at Top with Counts */}
          <div className="hidden md:flex items-center gap-4">
            {[
              { label: "Easy", count: easyCount, color: "bg-green-500" },
              { label: "Medium", count: mediumCount, color: "bg-yellow-500" },
              { label: "Hard/Adv", count: hardCount, color: "bg-red-500" },
            ].map((lv) => (
              <div
                key={lv.label}
                className={`flex items-center gap-1.5 transition-opacity ${
                  currentQuestion?.difficulty ===
                    (lv.label === "Hard/Adv" ? "Hard" : lv.label) ||
                  (lv.label === "Hard/Adv" &&
                    currentQuestion?.difficulty === "Advanced")
                    ? "opacity-100"
                    : "opacity-40"
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${lv.color}`} />
                <span className="text-[8px] font-black uppercase tracking-tighter">
                  {lv.label} ({lv.count})
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] px-3 py-1.5">
            <FaClock className="text-[var(--color-primary)]" size={10} />
            <span className="text-[9px] font-black uppercase">
              {timeLeft ?? "—"}s
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] shadow-[0_0_18px_var(--color-accent-glow)]">
          <div className="h-1 bg-[var(--color-background-elevated)]">
            <motion.div
              className="h-full bg-[var(--color-primary)]"
              animate={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-3 md:p-4">
            {startingBattle ? (
              <div className="py-20 text-center font-black uppercase tracking-[0.3em] text-[var(--text-color-muted)]">
                Initializing...
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${
                        currentQuestion?.difficulty === "Easy"
                          ? "border-green-500/50 text-green-500"
                          : currentQuestion?.difficulty === "Medium"
                            ? "border-yellow-500/50 text-yellow-500"
                            : "border-red-500/50 text-red-500"
                      }`}
                    >
                      {currentQuestion?.difficulty || "Unknown"} Phase
                    </span>
                    <h1 className="mt-2 text-xl font-black italic uppercase tracking-tight">
                      {battle?.title}
                    </h1>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-[var(--text-color-muted)]">
                      PROGRESS
                    </p>
                    <p className="text-sm font-black">
                      {currentIndex + 1}/{questions.length}
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion?._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-lg font-bold leading-tight mb-6">
                      {currentQuestion?.q}
                    </h2>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {currentQuestion?.options.map((opt, idx) => {
                        const isSelected = answersByIndex[currentIndex] === idx;
                        const isCorrect = review && idx === review.correctIndex;
                        const isWrong =
                          review &&
                          idx === review.selectedIndex &&
                          !review.isCorrect;

                        return (
                          <button
                            key={idx}
                            onClick={() => selectOption(idx)}
                            disabled={!!review || submitting}
                            className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                              isCorrect
                                ? "border-green-500 bg-green-500/10"
                                : isWrong
                                  ? "border-red-500 bg-red-500/10"
                                  : isSelected
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                                    : "border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] hover:border-[var(--color-primary)]/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black opacity-40">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="text-[13px] font-medium">
                                {opt}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex justify-between border-t border-[var(--border-color-primary)] pt-6">
                  <button
                    onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                    disabled={currentIndex === 0 || !!review}
                    className="px-6 py-2 text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 disabled:opacity-20"
                  >
                    Previous
                  </button>
                  <button
                    disabled={
                      answersByIndex[currentIndex] === undefined || !!review
                    }
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3 text-[10px] font-black uppercase italic tracking-widest text-black"
                  >
                    {currentIndex === questions.length - 1 ? "Finish" : "Next"}{" "}
                    <FaSkull />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizArena;
