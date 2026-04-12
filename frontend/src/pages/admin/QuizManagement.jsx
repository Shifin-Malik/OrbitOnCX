import React, { useState } from "react";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaRegClock,
  FaLayerGroup,
  FaListOl,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import QuizCreation from "../../components/admin/QuizCreation";

const QuizManagement = () => {
  // holds 'null' for list view, 'true' for new quiz, or '{object}' for editing
  const [activeView, setActiveView] = useState(null);
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      title: "Javascript Fundamentals",
      category: "JavaScript",
      questions: 25,
      duration: "30 min",
      status: "Published",
    },
    {
      id: 2,
      title: "React Hooks Masterclass",
      category: "React",
      questions: 15,
      duration: "20 min",
      status: "Draft",
    },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const currentQuizzes = quizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(quizzes.length / itemsPerPage);

  const paginate = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };

  const deleteQuiz = (id) => {
    if (window.confirm("Are you sure you want to delete this blueprint?")) {
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const handleEdit = (quiz) => {
    // In a real app, you might fetch the full question list via API here
    // For now, we pass the quiz meta data
    setActiveView(quiz);
  };

  const handleSave = (finalData) => {
    console.log("Payload for API:", finalData);
    // Logic: if activeView has an ID, call PUT, otherwise call POST
    setActiveView(null);
  };

  if (activeView) {
    return (
      <QuizCreation
        editData={activeView !== true ? activeView : null}
        onBack={() => setActiveView(null)}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-3.5 md:p-8 space-y-7 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 px-0.5">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_10px_var(--color-success-glow)] animate-pulse"></span>
            <p className="text-[var(--color-primary)] text-[9px] font-black uppercase tracking-[0.35em]">
              Repository Access
            </p>
          </div>
          <h2 className="text-4xl font-black text-[var(--text-color-primary)] tracking-tighter italic uppercase">
            ORBITON{" "}
            <span className="text-[var(--text-color-muted)] not-italic font-thin opacity-50">
              QUIZZES
            </span>
          </h2>
        </div>

        <button
          onClick={() => setActiveView(true)}
          className="group flex items-center gap-2.5 bg-[var(--color-primary)] text-white px-7 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--color-primary-dark)] transition-all shadow-lg shadow-[var(--color-success-glow)]"
        >
          <FaPlus
            size={12}
            className="group-hover:rotate-90 transition-transform"
          />
          Create New Quiz
        </button>
      </div>

      <div className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-[2rem] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-background-elevated)] border-b border-[var(--border-color-primary)]">
                <th className="px-9 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)]">
                  Quiz Blueprint
                </th>
                <th className="px-9 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)] text-center">
                  Structure
                </th>
                <th className="px-9 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)]">
                  Lifecycle
                </th>
                <th className="px-9 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color-secondary)]">
              {currentQuizzes.map((quiz) => (
                <tr
                  key={quiz.id}
                  className="group/row hover:bg-[var(--color-accent-glow)] transition-all duration-300"
                >
                  <td className="px-9 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-black text-lg">
                        {quiz.title.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-[var(--text-color-primary)] group-hover/row:text-[var(--color-primary)] transition-colors">
                          {quiz.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[var(--text-color-muted)] mt-0.5">
                          <FaLayerGroup size={9} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            {quiz.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-9 py-5">
                    <div className="flex items-center justify-center gap-7 text-[var(--text-color-secondary)]">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 font-black text-base">
                          <FaListOl className="text-[var(--color-primary)] opacity-40 text-[10px]" />{" "}
                          {quiz.questions}
                        </div>
                        <span className="text-[8px] uppercase font-bold text-[var(--text-color-muted)] tracking-widest">
                          Items
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 font-black text-base">
                          <FaRegClock className="text-[var(--color-accent)] text-[10px]" />{" "}
                          {quiz.duration.split(" ")[0]}
                        </div>
                        <span className="text-[8px] uppercase font-bold text-[var(--text-color-muted)] tracking-widest">
                          Min
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-9 py-5">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-[9px] font-black tracking-widest uppercase 
                      ${
                        quiz.status === "Published"
                          ? "bg-[var(--color-success-glow)] border-[var(--color-success)]/20 text-[var(--color-success)]"
                          : "bg-[var(--color-background-elevated)] border-[var(--border-color-primary)] text-[var(--text-color-muted)]"
                      }`}
                    >
                      {quiz.status === "Published" ? (
                        <FaCheckCircle size={10} />
                      ) : (
                        <FaTimesCircle size={10} />
                      )}
                      {quiz.status}
                    </div>
                  </td>
                  <td className="px-9 py-5 text-right">
                    <div className="flex justify-end gap-2.5 opacity-0 group-hover/row:opacity-100 translate-x-3 group-hover/row:translate-x-0 transition-all duration-300">
                      <button
                        onClick={() => handleEdit(quiz)}
                        className="p-2.5 rounded-lg border border-[var(--border-color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-all"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="p-2.5 rounded-lg border border-[var(--border-color-primary)] text-[var(--color-danger)] hover:bg-[var(--color-danger-glow)] transition-all"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuizManagement;
