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

const QuizManagement = () => {
  
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      title: "Javascript Fundamentals",
      category: "Programming",
      questions: 25,
      duration: "30 min",
      status: "Published",
    },
    {
      id: 2,
      title: "React Hooks Masterclass",
      category: "Web Dev",
      questions: 15,
      duration: "20 min",
      status: "Draft",
    },
    {
      id: 3,
      title: "Data Structures - Trees",
      category: "Algorithms",
      questions: 10,
      duration: "15 min",
      status: "Published",
    },
    {
      id: 4,
      title: "Tailwind CSS Layouts",
      category: "Design",
      questions: 20,
      duration: "25 min",
      status: "Published",
    },
    {
      id: 5,
      title: "Node.js Streams & Buffer",
      category: "Backend",
      questions: 12,
      duration: "18 min",
      status: "Archived",
    },
    {
      id: 6,
      title: "MongoDB Aggregation",
      category: "Database",
      questions: 30,
      duration: "45 min",
      status: "Published",
    },
  ]);


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuizzes = quizzes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(quizzes.length / itemsPerPage);

  const paginate = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };


  const deleteQuiz = (id) => {
    if (window.confirm("")) {
      setQuizzes(quizzes.filter((q) => q.id !== id));

      if (currentQuizzes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-0 space-y-8 animate-in fade-in duration-700">
    
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-1">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#059669] shadow-[0_0_12px_rgba(5,150,105,0.4)] animate-pulse"></span>
            <p className="text-[#059669] text-[10px] font-black uppercase tracking-[0.4em]">
              Content Repository
            </p>
          </div>
          <h2 className="text-5xl font-black text-[#064e3b] tracking-tighter italic uppercase">
            ORBITON{" "}
            <span className="text-slate-300 not-italic font-thin">QUIZZES</span>
          </h2>
        </div>

        <button className="group flex items-center gap-3 bg-[#059669] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#065f46] hover:shadow-2xl hover:shadow-emerald-100 transition-all active:scale-95">
          <FaPlus className="group-hover:rotate-90 transition-transform" />
          Create New Quiz
        </button>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f5f9] border-b border-[#e5e7eb]">
                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-[#9ca3af]">
                  Quiz Blueprint
                </th>
                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-[#9ca3af] text-center">
                  Structure
                </th>
                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-[#9ca3af]">
                  Lifecycle
                </th>
                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-[#9ca3af] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentQuizzes.map((quiz) => (
                <tr
                  key={quiz.id}
                  className="group/row hover:bg-[#ecfdf5]/50 transition-all duration-300"
                >
           
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-[#ecfdf5] border-2 border-[#059669]/10 text-[#059669] flex items-center justify-center font-black text-xl">
                        {quiz.title.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#064e3b] group-hover/row:text-[#059669] transition-colors">
                          {quiz.title}
                        </p>
                        <div className="flex items-center gap-2 text-[#9ca3af] mt-1">
                          <FaLayerGroup size={10} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {quiz.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

             
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center gap-8 text-[#374151]">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 font-black text-lg">
                          <FaListOl className="text-[#059669]/50 text-xs" />
                          {quiz.questions}
                        </div>
                        <span className="text-[9px] uppercase font-bold text-[#9ca3af] tracking-widest text-center">
                          Items
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 font-black text-lg">
                          <FaRegClock className="text-[#10b981] text-xs" />
                          {quiz.duration.split(" ")[0]}
                        </div>
                        <span className="text-[9px] uppercase font-bold text-[#9ca3af] tracking-widest text-center">
                          Min
                        </span>
                      </div>
                    </div>
                  </td>

             
                  <td className="px-10 py-6">
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[10px] font-black tracking-widest uppercase 
                      ${
                        quiz.status === "Published"
                          ? "bg-[#ecfdf5] border-[#10b981]/20 text-[#059669]"
                          : quiz.status === "Draft"
                            ? "bg-amber-50 border-amber-100 text-amber-600"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      {quiz.status === "Published" ? (
                        <FaCheckCircle />
                      ) : (
                        <FaTimesCircle />
                      )}
                      {quiz.status}
                    </div>
                  </td>

              
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover/row:opacity-100 translate-x-4 group-hover/row:translate-x-0 transition-all duration-300">
                      <button className="p-3 rounded-xl border border-[#e5e7eb] text-[#059669] hover:bg-[#ecfdf5] hover:shadow-md transition-all">
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="p-3 rounded-xl border border-[#e5e7eb] text-red-500 hover:bg-red-50 hover:shadow-md transition-all"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        
        <div className="px-10 py-8 bg-[#f1f5f9] border-t border-[#e5e7eb] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.3em]">
              System Capacity
            </p>
            <p className="text-xs text-[#374151] font-bold">
              Showing{" "}
              <span className="text-[#064e3b]">
                {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, quizzes.length)}
              </span>{" "}
              of{" "}
              <span className="text-[#059669]">{quizzes.length} Quizzes</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-12 w-12 flex items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white text-[#9ca3af] hover:text-[#059669] hover:border-[#059669] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              <FaChevronLeft size={12} />
            </button>

            <div className="flex items-center p-1.5 bg-white border border-[#e5e7eb] rounded-2xl gap-1 shadow-inner">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`h-10 px-5 rounded-xl text-[11px] font-black transition-all duration-300 ${
                    currentPage === i + 1
                      ? "bg-[#059669] text-white shadow-lg shadow-emerald-100"
                      : "text-[#9ca3af] hover:text-[#064e3b] hover:bg-slate-50"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </button>
              ))}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-12 w-12 flex items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white text-[#9ca3af] hover:text-[#059669] hover:border-[#059669] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizManagement;
