import React, { useState, useEffect } from "react";
import {
  FaTrash,
  FaArrowLeft,
  FaSave,
  FaPlusCircle,
  FaCode,
  FaListUl,
  FaFilePdf,
  FaMagic,
  FaSpinner,
  FaInfoCircle,
} from "react-icons/fa";

const QuizCreation = ({ onBack, onSave, editData }) => {
  const [importMode, setImportMode] = useState("manual"); // manual | bulk | ai
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkText, setBulkText] = useState("");

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
  const [questions, setQuestions] = useState([
    {
      q: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      difficulty: "Easy",
      explanation: "",
    },
  ]);

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
      if (editData.questions && editData.questions.length > 0) {
        setQuestions(editData.questions);
      }
    }
  }, [editData]);

  // --- PDF/AI GENERATION LOGIC ---
  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);

    // Logic to send to your MERN backend would go here
    // Example:
    // const formData = new FormData(); formData.append("pdf", file);
    // const response = await axios.post('/api/ai/generate', formData);

    setTimeout(() => {
      // Mock result
      setIsProcessing(false);
      setImportMode("manual");
      alert("AI has generated questions from your PDF! Please review them.");
    }, 3000);
  };

  // --- BULK PARSER LOGIC ---
  const handleBulkImport = () => {
    try {
      const parsed = JSON.parse(bulkText);
      if (Array.isArray(parsed)) {
        setQuestions(parsed);
        setImportMode("manual");
        setBulkText("");
      }
    } catch (e) {
      alert("Invalid JSON format. Please check the structure.");
    }
  };

  // --- QUESTION HANDLERS ---
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        q: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        difficulty: "Easy",
        explanation: "",
      },
    ]);
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
          return { ...item, options: newOptions };
        }
        return item;
      }),
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
      {/* --- HEADER SECTION --- */}
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
            { id: "bulk", icon: <FaCode />, label: "Bulk JSON" },
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
          onClick={() => onSave({ quizData, questions })}
          className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--color-primary-dark)] shadow-lg shadow-[var(--color-success-glow)] transition-all active:scale-95 flex items-center"
        >
          <FaSave className="mr-2" /> Save Blueprint
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
                    {[
                      "JavaScript",
                      "TypeScript",
                      "React",
                      "Node.js",
                      "MongoDB",
                      "CSS",
                      "Full-Stack",
                      "Python",
                      "Go",
                    ].map((c) => (
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
                    {["Easy", "Medium", "Advanced"].map((d) => (
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
          {/* AI / PDF MODE */}
          {importMode === "ai" ? (
            <div className="bg-[var(--color-background-soft)] p-10 rounded-[2rem] border-2 border-dashed border-[var(--border-color-primary)] flex flex-col items-center justify-center text-center space-y-6 transition-all hover:border-[var(--color-primary)]/40 h-[65vh]">
              {isProcessing ? (
                <div className="space-y-4 py-10 animate-pulse">
                  <FaSpinner className="text-4xl text-[var(--color-primary)] animate-spin mx-auto" />
                  <p className="text-[10px] font-black uppercase text-[var(--text-color-primary)] tracking-widest">
                    Orbiton AI is reading PDF...
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-20 w-20 bg-[var(--color-secondary)] rounded-3xl flex items-center justify-center text-[var(--color-primary)] text-3xl shadow-inner">
                    <FaFilePdf />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-[var(--text-color-primary)] uppercase tracking-tighter">
                      Generate from Document
                    </h3>
                    <p className="text-[10px] text-[var(--text-color-muted)] max-w-xs mx-auto">
                      Upload a PDF or Text file. Our AI will automatically
                      extract questions, options, difficulty, and explanations.
                    </p>
                  </div>
                  <input
                    type="file"
                    id="ai-upload"
                    className="hidden"
                    accept=".pdf,.txt"
                    onChange={handlePDFUpload}
                  />
                  <label
                    htmlFor="ai-upload"
                    className="bg-[var(--color-primary)] text-white px-10 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:shadow-xl transition-all active:scale-95"
                  >
                    Browse PDF File
                  </label>
                </>
              )}
            </div>
          ) : /* BULK MODE */
          importMode === "bulk" ? (
            <div className="bg-[var(--color-background-soft)] p-6 rounded-[1.5rem] border border-[var(--border-color-primary)] space-y-4">
              <div className="flex items-center gap-2 text-[var(--color-primary)]">
                <FaInfoCircle size={12} />
                <p className="text-[9px] font-black uppercase tracking-widest">
                  JSON Bulk Import
                </p>
              </div>
              <textarea
                className="w-full h-[50vh] bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-4 text-[10px] font-mono outline-none focus:ring-1 ring-[var(--color-primary)] custom-scrollbar"
                placeholder='[{"q": "Example?", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "difficulty": "Easy", "explanation": "Because..."}]'
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <button
                onClick={handleBulkImport}
                className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--color-primary-dark)] transition-all"
              >
                Process JSON Structure
              </button>
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
                              className="w-full bg-white border border-[var(--border-color-primary)] rounded-lg p-2 text-[10px] outline-none focus:border-[var(--color-primary)]"
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
                            Correct Answer
                          </label>
                          <select
                            className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-lg p-2 text-xs font-bold text-[var(--color-success)] outline-none"
                            value={q.correctAnswer}
                            onChange={(e) =>
                              handleQuestionChange(
                                qIdx,
                                "correctAnswer",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Option</option>
                            {q.options.map(
                              (opt, i) =>
                                opt && (
                                  <option key={i} value={opt}>
                                    {opt}
                                  </option>
                                ),
                            )}
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
                            {["Easy", "Medium", "Advanced"].map((d) => (
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCreation;
