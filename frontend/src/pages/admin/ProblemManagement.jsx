import React, { useState } from "react";
import { 
  FaTrash, FaEdit, FaPlus, FaSearch, FaFilter, 
  FaBrain, FaCode, FaCheckDouble, FaExclamationTriangle 
} from "react-icons/fa";

const ProblemManagement = () => {

  const [problems, setProblems] = useState([
    {
      id: "P001",
      question: "What is the output of console.log(typeof NaN)?",
      category: "JavaScript",
      difficulty: "Easy",
      correctOption: "number",
      points: 5
    },
    {
      id: "P002",
      question: "Explain the difference between useMemo and useCallback.",
      category: "React",
      difficulty: "Hard",
      correctOption: "Conceptual",
      points: 15
    },
    {
      id: "P003",
      question: "Implement a function to find the Longest Increasing Subsequence.",
      category: "DSA",
      difficulty: "Hard",
      correctOption: "Code Snippet",
      points: 20
    },
    {
      id: "P004",
      question: "Which hook is used to handle side effects in React?",
      category: "React",
      difficulty: "Easy",
      correctOption: "useEffect",
      points: 5
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const getDifficultyColor = (level) => {
    switch (level) {
      case "Easy": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Medium": return "bg-amber-50 text-amber-600 border-amber-100";
      case "Hard": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-slate-50 text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 space-y-8 animate-in fade-in duration-700">
      
     
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#059669] shadow-[0_0_12px_rgba(5,150,105,0.4)] animate-pulse"></span>
            <p className="text-[#059669] text-[10px] font-black uppercase tracking-[0.4em]">
              Problem Bank Admin
            </p>
          </div>
          <h2 className="text-5xl font-black text-[#064e3b] tracking-tighter italic uppercase">
            ARENA{" "}
            <span className="text-slate-300 not-italic font-thin">PROBLEMS</span>
          </h2>
        </div>
      </div>

    
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search problems by name or category..."
            className="w-full pl-12 pr-4 py-4 bg-[#f1f5f9] border-none rounded-2xl focus:ring-2 focus:ring-[#059669]/20 outline-none text-sm font-medium transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border border-[#e5e7eb] rounded-2xl text-[#374151] font-black text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-all">
            <FaFilter /> Filter
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[#059669] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#065f46] shadow-lg shadow-emerald-100 transition-all active:scale-95">
            <FaPlus /> Add Problem
          </button>
        </div>
      </div>

   
      <div className="grid grid-cols-1 gap-4">
        {problems
          .filter(p => p.question.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((prob) => (
          <div key={prob.id} className="group bg-white border border-[#e5e7eb] p-6 rounded-[2.5rem] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#f1f5f9] text-[#064e3b] text-[9px] font-black rounded-lg uppercase tracking-widest border border-slate-100">
                    {prob.id}
                  </span>
                  <span className={`px-3 py-1 border rounded-lg text-[9px] font-black uppercase tracking-widest ${getDifficultyColor(prob.difficulty)}`}>
                    {prob.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-[#059669] text-[10px] font-black uppercase tracking-wider">
                    <FaCheckDouble size={10}/> {prob.points} PTS
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#064e3b] leading-tight tracking-tight group-hover:text-[#059669] transition-colors">
                  {prob.question}
                </h3>
                <div className="flex items-center gap-4 text-[#9ca3af]">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                    <FaBrain className="text-slate-400" size={10} />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">{prob.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end lg:self-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                <button className="p-4 bg-[#ecfdf5] text-[#059669] rounded-2xl hover:bg-[#059669] hover:text-white hover:shadow-lg hover:shadow-emerald-100 transition-all">
                  <FaEdit size={16} />
                </button>
                <button className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-100 transition-all">
                  <FaTrash size={16} />
                </button>
              </div>
              
            </div>
          </div>
        ))}
      </div>

   
      <div className="flex flex-col md:flex-row items-center justify-between px-8 py-5 bg-[#064e3b] rounded-[2rem] text-white gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#059669] rounded-lg">
            <FaExclamationTriangle className="text-amber-400" size={14} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em]">
            Database Sync Status: <span className="text-amber-400 ml-2">Active ({problems.length} Items)</span>
          </p>
        </div>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">
          Orbiton Arena v2.0 // Core Management
        </p>
      </div>
    </div>
  );
};

export default ProblemManagement;