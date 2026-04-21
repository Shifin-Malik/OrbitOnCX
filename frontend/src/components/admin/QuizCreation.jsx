import React, { useState, useEffect } from "react";
import {
  FaTrash,
  FaArrowLeft,
  FaSave,
  FaEdit,
  FaPlusCircle,
  FaListUl,
  FaFilePdf,
  FaMagic,
  FaSpinner,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import QuizPdfFormatGuide from "./QuizPdfFormatGuide.jsx";

const CATEGORY_OPTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "MongoDB",
  "CSS",
  "Full-Stack",
  "Python",
  "Go",
];

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Advanced"];
const OPTION_LABELS = ["A", "B", "C", "D"];

const createEmptyQuestion = () => ({
  q: "",
  options: ["", "", "", ""],
  correctOption: "",
  correctAnswer: "",
  difficulty: "Easy",
  explanation: "",
});

const normalizeText = (value) => String(value || "").trim();

const resolveCorrectOption = ({ correctOption, correctAnswer, options }) => {
  const normalizedOption = normalizeText(correctOption).toUpperCase();
  if (OPTION_LABELS.includes(normalizedOption)) {
    return normalizedOption;
  }

  const normalizedAnswer = normalizeText(correctAnswer).toLowerCase();
  if (!normalizedAnswer) return "";

  const optionIndex = options.findIndex(
    (option) => normalizeText(option).toLowerCase() === normalizedAnswer,
  );

  return optionIndex >= 0 ? OPTION_LABELS[optionIndex] : "";
};

const normalizeQuestion = (raw = {}) => {
  const options = Array.isArray(raw.options) ? [...raw.options] : [];
  while (options.length < 4) options.push("");

  const normalizedOptions = options
    .slice(0, 4)
    .map((option) => normalizeText(option));
  const resolvedCorrectOption = resolveCorrectOption({
    correctOption: raw.correctOption,
    correctAnswer: raw.correctAnswer || raw.answer,
    options: normalizedOptions,
  });
  const resolvedCorrectAnswer = resolvedCorrectOption
    ? normalizedOptions[OPTION_LABELS.indexOf(resolvedCorrectOption)] || ""
    : normalizeText(raw.correctAnswer || raw.answer || "");

  return {
    _id: raw._id || raw.id || undefined,
    q: normalizeText(raw.q || raw.question || ""),
    options: normalizedOptions,
    correctOption: resolvedCorrectOption,
    correctAnswer: resolvedCorrectAnswer,
    difficulty: raw.difficulty || "Easy",
    explanation: normalizeText(raw.explanation || ""),
  };
};

const isQuestionEmpty = (question) => {
  const normalized = normalizeQuestion(question);
  const hasText = normalized.q.trim().length > 0;
  const hasOptions = normalized.options.some(
    (option) => option.trim().length > 0,
  );
  const hasAnswer = normalized.correctAnswer.trim().length > 0;
  const hasExplanation = normalized.explanation.trim().length > 0;

  return !hasText && !hasOptions && !hasAnswer && !hasExplanation;
};

const sanitizeQuestionsForSave = (questions = []) =>
  questions
    .map((question) => {
      const normalized = normalizeQuestion(question);
      if (normalized.correctOption) {
        const optionIndex = OPTION_LABELS.indexOf(normalized.correctOption);
        normalized.correctAnswer = normalized.options[optionIndex] || "";
      }
      return normalized;
    })
    .filter((question) => !isQuestionEmpty(question));

const normalizeQuizPayload = (quizData, isActive) => ({
  ...quizData,
  title: String(quizData?.title || "").trim(),
  description: String(quizData?.description || "").trim(),
  category: quizData?.category || "JavaScript",
  difficulty: quizData?.difficulty || "Easy",
  xpPotential: Number(quizData?.xpPotential || 0),
  timeLimit: Number(quizData?.timeLimit || 0),
  thumbnail: String(quizData?.thumbnail || "").trim(),
  isActive,
});

const getPreviewWarnings = (preview) => {
  if (Array.isArray(preview?.parseWarnings)) {
    return preview.parseWarnings;
  }

  if (Array.isArray(preview?.warnings)) {
    return preview.warnings;
  }

  if (Array.isArray(preview?.meta?.parseWarnings)) {
    return preview.meta.parseWarnings;
  }

  if (Array.isArray(preview?.meta?.warnings)) {
    return preview.meta.warnings;
  }

  return [];
};

const QuizCreation = ({
  onBack,
  onSave,
  editData,
  isSubmitting = false,
  isEditLoading = false,
  onPreviewPdf,
  onCommitPdfImport,
  pdfPreview,
  pdfPreviewError,
  parseSummary,
  parseWarnings,
  parseInvalidItems,
  selectedPdfFileName,
  onPdfFileNameChange,
  onClearPdfPreview,
}) => {
  const [importMode, setImportMode] = useState("manual"); // manual | ai
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [editingParsedIndex, setEditingParsedIndex] = useState(-1);

  // Aligned perfectly with Quiz Mongoose Schema
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    category: "JavaScript",
    difficulty: "Easy",
    xpPotential: 1000,
    timeLimit: 600,
    thumbnail: "",
    isActive: true,
  });

  // Aligned perfectly with Question Mongoose Schema
  const [questions, setQuestions] = useState([createEmptyQuestion()]);

  const isBusy = isSubmitting || isProcessing || isEditLoading;
  const isEditMode = Boolean(editData?._id);

  // Sync state if editing existing quiz
  useEffect(() => {
    if (editData) {
      setQuizData({
        title: editData.title || "",
        description: editData.description || "",
        category: editData.category || "JavaScript",
        difficulty: editData.difficulty || "Easy",
        xpPotential: editData.xpPotential || 1000,
        timeLimit: editData.timeLimit || 600,
        thumbnail: editData.thumbnail || "",
        isActive: editData.isActive !== false,
      });
      const mappedQuestions =
        Array.isArray(editData.questions) && editData.questions.length > 0
          ? editData.questions.map((question) => normalizeQuestion(question))
          : [createEmptyQuestion()];
      setQuestions(mappedQuestions);
      return;
    }

    setQuizData({
      title: "",
      description: "",
      category: "JavaScript",
      difficulty: "Easy",
      xpPotential: 1000,
      timeLimit: 600,
      thumbnail: "",
      isActive: true,
    });
    setQuestions([createEmptyQuestion()]);
  }, [editData]);

  useEffect(() => {
    if (!pdfPreview?.questions?.length) return;

    setQuestions(
      pdfPreview.questions.map((question) => normalizeQuestion(question)),
    );
    setEditingParsedIndex(-1);

    if (!isEditMode && pdfPreview?.quizData) {
      setQuizData((prev) => ({
        ...prev,
        title: prev.title || pdfPreview.quizData.title || "",
        description: prev.description || pdfPreview.quizData.description || "",
        category: pdfPreview.quizData.category || prev.category,
        difficulty: pdfPreview.quizData.difficulty || prev.difficulty,
        xpPotential:
          Number.isInteger(pdfPreview.quizData.xpPotential) &&
          pdfPreview.quizData.xpPotential >= 0
            ? pdfPreview.quizData.xpPotential
            : prev.xpPotential,
        timeLimit:
          Number.isInteger(pdfPreview.quizData.timeLimit) &&
          pdfPreview.quizData.timeLimit > 0
            ? pdfPreview.quizData.timeLimit
            : prev.timeLimit,
      }));
    }
  }, [pdfPreview, isEditMode]);

  // --- PDF/AI GENERATION LOGIC ---
  const handlePdfFileSelection = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedPdfFile(file);

    if (onPdfFileNameChange) {
      onPdfFileNameChange(file?.name || "");
    }
  };

  const handleParseSelectedPdf = async () => {
    if (!selectedPdfFile) {
      toast.error("Please select a PDF file first.");
      return;
    }

    if (!onPreviewPdf) {
      toast.error("PDF preview is not connected yet.");
      return;
    }

    setIsProcessing(true);

    try {
      const preview = await onPreviewPdf({
        file: selectedPdfFile,
        defaultDifficulty: quizData.difficulty,
        defaultCategory: quizData.category,
      });

      const warningCount = getPreviewWarnings(preview).length;
      const validCount =
        Number(preview?.summary?.valid || preview?.meta?.validCount || 0) ||
        Number(preview?.questions?.length || 0);

      toast.success(`Parsed ${validCount} valid question(s) from PDF.`);
      if (warningCount > 0) {
        toast(`Parsed with ${warningCount} warning(s). Review before saving.`);
      }
    } catch (error) {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to parse PDF file",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveClick = async (
    mode = quizData.isActive ? "publish" : "draft",
  ) => {
    if (!onSave) return;

    const shouldPublish = mode === "publish";
    const normalizedQuiz = normalizeQuizPayload(quizData, shouldPublish);
    const preparedQuestions = sanitizeQuestionsForSave(questions);

    if (!normalizedQuiz.title) {
      toast.error("Quiz title is required.");
      return;
    }

    await onSave({
      quizData: normalizedQuiz,
      questions: preparedQuestions,
    });
  };

  const handleApplyPreviewToEditor = () => {
    if (!pdfPreview?.questions?.length) {
      toast.error("No parsed questions found.");
      return;
    }

    setQuestions(
      pdfPreview.questions.map((question) => normalizeQuestion(question)),
    );
    setImportMode("manual");
    toast.success("Parsed questions loaded into editor.");
  };

  const handleCommitPdfSave = async (
    mode = quizData.isActive ? "publish" : "draft",
  ) => {
    if (!onCommitPdfImport) {
      toast.error("PDF save flow is not connected yet.");
      return;
    }

    if (!pdfPreview?.questions?.length) {
      toast.error("Please preview a PDF before saving.");
      return;
    }

    setIsProcessing(true);

    try {
      const shouldPublish = mode === "publish";
      const normalizedQuiz = normalizeQuizPayload(quizData, shouldPublish);
      const preparedQuestions = sanitizeQuestionsForSave(questions);

      await onCommitPdfImport({
        quizData: normalizedQuiz,
        questions: preparedQuestions,
        mode,
      });
    } catch (error) {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to save parsed PDF questions",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrimarySave = async () => {
    const mode = quizData.isActive ? "publish" : "draft";
    if (importMode === "ai" && pdfPreview?.questions?.length) {
      await handleCommitPdfSave(mode);
      return;
    }

    await handleSaveClick(mode);
  };

  // --- QUESTION HANDLERS ---
  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    setQuestions((prev) =>
      prev.map((item, i) => {
        if (i === qIndex) {
          const newOptions = [...item.options];
          newOptions[oIndex] = value;
          const optionLabel = OPTION_LABELS[oIndex];
          const shouldSyncCorrectAnswer = item.correctOption === optionLabel;
          return {
            ...item,
            options: newOptions,
            correctAnswer: shouldSyncCorrectAnswer ? value : item.correctAnswer,
          };
        }
        return item;
      }),
    );
  };

  const handleCorrectOptionChange = (qIndex, optionLabel) => {
    setQuestions((prev) =>
      prev.map((item, i) => {
        if (i !== qIndex) return item;
        const nextOptionLabel = OPTION_LABELS.includes(optionLabel)
          ? optionLabel
          : "";
        const optionIndex = OPTION_LABELS.indexOf(nextOptionLabel);
        return {
          ...item,
          correctOption: nextOptionLabel,
          correctAnswer:
            optionIndex >= 0 ? item.options[optionIndex] || "" : "",
        };
      }),
    );
  };

  const handleResetParsedState = () => {
    if (onClearPdfPreview) {
      onClearPdfPreview();
    }
    if (onPdfFileNameChange) {
      onPdfFileNameChange("");
    }
    setSelectedPdfFile(null);
    setEditingParsedIndex(-1);
  };

  const parsedSummary = parseSummary ||
    pdfPreview?.summary || {
      totalParsed: Number(pdfPreview?.meta?.totalDetected || 0),
      valid: Number(pdfPreview?.meta?.validCount || 0),
      duplicates: Number(pdfPreview?.meta?.duplicateCount || 0),
      invalid: Number(pdfPreview?.meta?.invalidCount || 0),
      warningCount: getPreviewWarnings(pdfPreview).length,
      byDifficulty: pdfPreview?.meta?.byDifficulty || {
        Easy: 0,
        Medium: 0,
        Advanced: 0,
      },
    };

  const parsedWarningList =
    Array.isArray(parseWarnings) && parseWarnings.length > 0
      ? parseWarnings
      : getPreviewWarnings(pdfPreview);

  const parsedInvalidList =
    Array.isArray(parseInvalidItems) && parseInvalidItems.length > 0
      ? parseInvalidItems
      : Array.isArray(pdfPreview?.invalidItems)
        ? pdfPreview.invalidItems
        : [];
  const isParsingPdf = isProcessing || isSubmitting;
  const selectedPdfLabel = selectedPdfFile?.name || selectedPdfFileName || "";

  if (isEditLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="h-12 w-12 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
            Loading Quiz Blueprint...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-[var(--border-color-primary)] pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--text-color-muted)] hover:text-[var(--color-primary)] transition-colors font-black text-[10px] uppercase tracking-widest"
        >
          <FaArrowLeft /> Cancel
        </button>

        {/* --- NAVIGATION TABS --- */}
        <div className="flex bg-[var(--color-background-elevated)] p-1 rounded-xl border border-[var(--border-color-primary)]">
          {[
            { id: "manual", icon: <FaListUl />, label: "Manual" },
            { id: "ai", icon: <FaMagic />, label: "PDF / AI" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setImportMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                importMode === mode.id
                  ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-success-glow)]"
                  : "text-[var(--text-color-muted)] hover:text-[var(--color-primary)]"
              }`}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>

        <button
          onClick={handlePrimarySave}
          disabled={isBusy}
          className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--color-primary-dark)] shadow-lg shadow-[var(--color-success-glow)] transition-all active:scale-95 flex items-center"
        >
          {isBusy ? (
            <FaSpinner className="mr-2 animate-spin" />
          ) : (
            <FaSave className="mr-2" />
          )}
          {isEditMode
            ? "Update Blueprint"
            : quizData.isActive
              ? "Publish Quiz"
              : "Save Draft"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT: METADATA (QUIZ SCHEMA) --- */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[var(--color-background-soft)] p-5 rounded-[1.5rem] border border-[var(--border-color-primary)] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest">
                01. Quiz Settings
              </p>
              <label className="flex items-center cursor-pointer gap-2">
                <span className="text-[8px] font-black uppercase text-[var(--text-color-muted)]">
                  Active
                </span>
                <input
                  type="checkbox"
                  checked={quizData.isActive}
                  onChange={(e) =>
                    setQuizData({ ...quizData, isActive: e.target.checked })
                  }
                  className="accent-[var(--color-primary)]"
                />
              </label>
            </div>

            <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[65vh] pr-1">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                  Title *
                </label>
                <input
                  type="text"
                  value={quizData.title}
                  className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none focus:border-[var(--color-primary)]"
                  placeholder="e.g., Advanced MERN Concepts"
                  onChange={(e) =>
                    setQuizData({ ...quizData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={quizData.description}
                  className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none focus:border-[var(--color-primary)]"
                  placeholder="Brief description of the quiz..."
                  rows="2"
                  onChange={(e) =>
                    setQuizData({ ...quizData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={quizData.category}
                    className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none"
                    onChange={(e) =>
                      setQuizData({ ...quizData, category: e.target.value })
                    }
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                    Difficulty *
                  </label>
                  <select
                    value={quizData.difficulty}
                    className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none"
                    onChange={(e) =>
                      setQuizData({ ...quizData, difficulty: e.target.value })
                    }
                  >
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                    Time Limit (sec)
                  </label>
                  <input
                    type="number"
                    value={quizData.timeLimit}
                    className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none"
                    onChange={(e) =>
                      setQuizData({
                        ...quizData,
                        timeLimit: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                    XP Potential
                  </label>
                  <input
                    type="number"
                    value={quizData.xpPotential}
                    className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none"
                    onChange={(e) =>
                      setQuizData({
                        ...quizData,
                        xpPotential: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                  Thumbnail URL
                </label>
                <input
                  type="text"
                  value={quizData.thumbnail}
                  className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none"
                  placeholder="https://..."
                  onChange={(e) =>
                    setQuizData({ ...quizData, thumbnail: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT: DYNAMIC WORKSPACE (QUESTION SCHEMA) --- */}
        <div className="lg:col-span-2">
          <QuizPdfFormatGuide />
          {importMode === "ai" ? (
            <div className="space-y-4">
              <div className="bg-[var(--color-background-soft)] p-5 rounded-[1.5rem] border border-[var(--border-color-primary)] shadow-sm space-y-4">
                <p className="text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest">
                  02. PDF Upload + Parse
                </p>

                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                      Upload Quiz PDF
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfFileSelection}
                      disabled={isBusy}
                      className="w-full text-[11px] font-medium file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-[var(--border-color-primary)] file:bg-[var(--color-background-elevated)] file:font-black file:text-[10px] file:uppercase file:tracking-widest file:cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={handleParseSelectedPdf}
                    disabled={isBusy || !selectedPdfFile}
                    className="px-5 py-3 bg-[var(--color-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-success-glow)] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isParsingPdf ? (
                      <FaSpinner className="mr-2 animate-spin" />
                    ) : (
                      <FaMagic className="mr-2" />
                    )}
                    {isParsingPdf ? "Parsing..." : "Parse PDF"}
                  </button>
                </div>

                {selectedPdfLabel ? (
                  <p className="text-[10px] font-bold text-[var(--text-color-secondary)]">
                    Selected file:{" "}
                    <span className="text-[var(--text-color-primary)]">
                      {selectedPdfLabel}
                    </span>
                  </p>
                ) : null}

                {pdfPreviewError ? (
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-rose-500 text-[11px] font-bold">
                    {pdfPreviewError?.message ||
                      pdfPreviewError?.errors?.[0] ||
                      "Failed to parse PDF."}
                  </div>
                ) : null}
              </div>

              {pdfPreview?.questions?.length ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Total Parsed",
                        value: parsedSummary?.totalParsed || questions.length,
                      },
                      {
                        label: "Valid",
                        value: parsedSummary?.valid || questions.length,
                      },
                      {
                        label: "Invalid",
                        value: parsedSummary?.invalid || 0,
                      },
                      {
                        label: "Warnings",
                        value:
                          parsedSummary?.warningCount ||
                          parsedWarningList.length,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-xl p-3"
                      >
                        <p className="text-[9px] font-black uppercase text-[var(--text-color-muted)] tracking-wider">
                          {item.label}
                        </p>
                        <p className="text-lg font-black text-[var(--text-color-primary)]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {DIFFICULTY_OPTIONS.map((difficulty) => (
                      <div
                        key={difficulty}
                        className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-xl p-3"
                      >
                        <p className="text-[9px] font-black uppercase text-[var(--text-color-muted)] tracking-wider">
                          {difficulty}
                        </p>
                        <p className="text-base font-black text-[var(--text-color-primary)]">
                          {parsedSummary?.byDifficulty?.[difficulty] || 0}
                        </p>
                      </div>
                    ))}
                  </div>

                  {parsedWarningList.length > 0 ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-700 space-y-1">
                      {parsedWarningList.slice(0, 6).map((warning, index) => (
                        <p key={`${warning}-${index}`}>{warning}</p>
                      ))}
                    </div>
                  ) : null}

                  {parsedInvalidList.length > 0 ? (
                    <div className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-xl p-3 text-[10px] text-[var(--text-color-secondary)]">
                      <p className="font-black uppercase tracking-wider text-[var(--text-color-muted)] mb-1">
                        Skipped Invalid Blocks: {parsedInvalidList.length}
                      </p>
                      <p>
                        Invalid blocks were skipped safely. You can continue
                        with parsed valid questions below.
                      </p>
                    </div>
                  ) : null}

                  <div className="bg-[var(--color-background-soft)] p-5 rounded-[1.5rem] border border-[var(--border-color-primary)] shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <p className="text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest">
                        03. Parsed Question Preview ({questions.length})
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleApplyPreviewToEditor}
                          className="px-3 py-2 border border-[var(--border-color-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-[var(--color-primary)] transition-all"
                        >
                          Sync To Manual
                        </button>
                        <button
                          onClick={handleResetParsedState}
                          className="px-3 py-2 border border-[var(--border-color-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-[var(--color-danger)] transition-all"
                        >
                          Reset Parsed State
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1 custom-scrollbar">
                      {questions.map((item, idx) => {
                        const isEditing = editingParsedIndex === idx;

                        return (
                          <div
                            key={`${item._id || "parsed"}-${idx}`}
                            className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-4 space-y-3"
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <p className="text-[11px] font-black text-[var(--text-color-primary)]">
                                Q{idx + 1}. {item.q || "Untitled question"}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    setEditingParsedIndex(isEditing ? -1 : idx)
                                  }
                                  className="px-2.5 py-1.5 border border-[var(--border-color-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-[var(--color-primary)] transition-all flex items-center gap-1"
                                >
                                  <FaEdit size={10} />
                                  {isEditing ? "Close" : "Edit"}
                                </button>
                                <button
                                  onClick={() => removeQuestion(idx)}
                                  disabled={isBusy}
                                  className="px-2.5 py-1.5 border border-[var(--border-color-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-[var(--color-danger)] transition-all flex items-center gap-1"
                                >
                                  <FaTrash size={10} />
                                  Delete
                                </button>
                              </div>
                            </div>

                            {!isEditing ? (
                              <div className="space-y-2">
                                <p className="text-[11px] text-[var(--text-color-secondary)]">
                                  {item.q}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {item.options.map((option, optionIndex) => (
                                    <p
                                      key={`${idx}-option-${optionIndex}`}
                                      className="text-[10px] text-[var(--text-color-muted)]"
                                    >
                                      {OPTION_LABELS[optionIndex]}. {option}
                                    </p>
                                  ))}
                                </div>
                                <p className="text-[10px] text-[var(--text-color-muted)]">
                                  Correct:{" "}
                                  <span className="font-black text-[var(--color-success)]">
                                    {item.correctOption || "-"}
                                  </span>{" "}
                                  {item.correctAnswer
                                    ? `(${item.correctAnswer})`
                                    : ""}
                                </p>
                                <p className="text-[10px] text-[var(--text-color-muted)]">
                                  Difficulty:{" "}
                                  <span className="font-black text-[var(--text-color-primary)]">
                                    {item.difficulty || "Easy"}
                                  </span>
                                </p>
                                {item.explanation ? (
                                  <p className="text-[10px] text-[var(--text-color-muted)]">
                                    Explanation: {item.explanation}
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                                    Question
                                  </label>
                                  <textarea
                                    className="w-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none focus:border-[var(--color-primary)]"
                                    rows="2"
                                    value={item.q}
                                    onChange={(event) =>
                                      handleQuestionChange(
                                        idx,
                                        "q",
                                        event.target.value,
                                      )
                                    }
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {item.options.map((option, optionIndex) => (
                                    <div
                                      key={`${idx}-edit-option-${optionIndex}`}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="text-[8px] font-black text-[var(--color-primary)]">
                                        {OPTION_LABELS[optionIndex]}
                                      </span>
                                      <input
                                        className="w-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-lg p-2 text-[10px] outline-none focus:border-[var(--color-primary)]"
                                        value={option}
                                        onChange={(event) =>
                                          handleOptionChange(
                                            idx,
                                            optionIndex,
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                                      Correct Option
                                    </label>
                                    <select
                                      className="w-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs font-bold text-[var(--color-success)] outline-none"
                                      value={item.correctOption || ""}
                                      onChange={(event) =>
                                        handleCorrectOptionChange(
                                          idx,
                                          event.target.value,
                                        )
                                      }
                                    >
                                      <option value="">Select</option>
                                      {OPTION_LABELS.map((label) => (
                                        <option key={label} value={label}>
                                          {label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                                      Difficulty
                                    </label>
                                    <select
                                      className="w-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none"
                                      value={item.difficulty}
                                      onChange={(event) =>
                                        handleQuestionChange(
                                          idx,
                                          "difficulty",
                                          event.target.value,
                                        )
                                      }
                                    >
                                      {DIFFICULTY_OPTIONS.map((difficulty) => (
                                        <option
                                          key={difficulty}
                                          value={difficulty}
                                        >
                                          {difficulty}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                                    Explanation
                                  </label>
                                  <textarea
                                    className="w-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none focus:border-[var(--color-primary)]"
                                    rows="2"
                                    value={item.explanation}
                                    onChange={(event) =>
                                      handleQuestionChange(
                                        idx,
                                        "explanation",
                                        event.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCommitPdfSave("draft")}
                        disabled={isBusy}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60"
                      >
                        Save As Draft
                      </button>
                      <button
                        onClick={() => handleCommitPdfSave("publish")}
                        disabled={isBusy}
                        className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-60"
                      >
                        Publish
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-[var(--color-background-soft)] p-10 rounded-[1.5rem] border-2 border-dashed border-[var(--border-color-primary)] text-center space-y-3">
                  <div className="h-16 w-16 mx-auto bg-[var(--color-secondary)] rounded-2xl flex items-center justify-center text-[var(--color-primary)] text-2xl shadow-inner">
                    <FaFilePdf />
                  </div>
                  <p className="text-sm font-black text-[var(--text-color-primary)] uppercase tracking-tight">
                    Parse Quiz PDF
                  </p>
                  <p className="text-[10px] text-[var(--text-color-muted)] max-w-md mx-auto">
                    Select a structured quiz PDF, click parse, review extracted
                    questions, edit if needed, and then save.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* MANUAL MODE */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest">
                  02. Question Bank ({questions.length})
                </p>
                <button
                  onClick={addQuestion}
                  className="text-[var(--color-primary)] flex items-center gap-1.5 text-[9px] font-black uppercase hover:opacity-70 transition-opacity"
                >
                  <FaPlusCircle /> Add Item
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[65vh] pr-2 custom-scrollbar">
                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="bg-[var(--color-background-soft)] p-5 rounded-[1.5rem] border border-[var(--border-color-primary)] relative group/q transition-all hover:border-[var(--color-primary)]/30 shadow-sm"
                  >
                    <button
                      onClick={() => removeQuestion(qIdx)}
                      disabled={isBusy}
                      className="absolute top-5 right-5 text-red-400 opacity-0 group-hover/q:opacity-100 transition-opacity hover:text-red-600"
                    >
                      <FaTrash size={12} />
                    </button>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                          Question {qIdx + 1}
                        </label>
                        <textarea
                          className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none focus:border-[var(--color-primary)]"
                          rows="2"
                          placeholder="What is the output of..."
                          value={q.q}
                          onChange={(e) =>
                            handleQuestionChange(qIdx, "q", e.target.value)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-[var(--color-primary)]">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <input
                              className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-[10px] outline-none focus:border-[var(--color-primary)]"
                              value={opt}
                              placeholder={`Option ${oIdx + 1}`}
                              onChange={(e) =>
                                handleOptionChange(qIdx, oIdx, e.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-color-secondary)]">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                            Correct Option
                          </label>
                          <select
                            className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs font-bold text-[var(--color-success)] outline-none"
                            value={q.correctOption || ""}
                            onChange={(e) =>
                              handleCorrectOptionChange(qIdx, e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            {OPTION_LABELS.map((label, index) => (
                              <option key={label} value={label}>
                                {label}.{" "}
                                {q.options[index] || `Option ${index + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                            Difficulty
                          </label>
                          <select
                            className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none"
                            value={q.difficulty}
                            onChange={(e) =>
                              handleQuestionChange(
                                qIdx,
                                "difficulty",
                                e.target.value,
                              )
                            }
                          >
                            {DIFFICULTY_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-[var(--text-color-muted)] uppercase tracking-wider">
                          Explanation (Optional)
                        </label>
                        <textarea
                          className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs outline-none focus:border-[var(--color-primary)]"
                          rows="1"
                          placeholder="Explain why this answer is correct..."
                          value={q.explanation}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIdx,
                              "explanation",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {questions.length === 0 ? (
                  <div className="bg-[var(--color-background-soft)] p-6 rounded-[1.5rem] border border-[var(--border-color-primary)] text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                      No questions yet. Add one manually or parse a PDF.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCreation;
