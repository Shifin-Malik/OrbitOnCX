import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers } from "../../features/admin/adminSlice.js";
import {
  FaTrash,
  FaUserEdit,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaLock,
  FaLockOpen,
  FaCode,
  FaQuestionCircle,
} from "react-icons/fa";

const UserManagement = () => {
  const dispatch = useDispatch();

 
  const { users = [], loading, error } = useSelector((state) => state.admin);

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };


  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

 
  const handleToggleStatus = (id, currentStatus) => {
    console.log("Toggle status for:", id);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      
      console.log("Delete user:", id);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <p className="text-red-500 font-bold bg-red-50 px-6 py-3 rounded-2xl border border-red-100 italic">
          System Error: {error}
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
   
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse"></span>
            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.4em]">
              Operational Oversight
            </p>
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">
            ORBITON{" "}
            <span className="text-slate-300 not-italic font-thin">ARENA</span>
          </h2>
        </div>
        <button className="group flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-200 transition-all active:scale-95">
          <FaPlus className="group-hover:rotate-90 transition-transform" /> New
          Candidate
        </button>
      </div>

   
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-3 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Candidate Identity
                </th>
                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                  Performance
                </th>
                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Status
                </th>
                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                  System Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentUsers.map((user) => (
                <tr
                  key={user._id}
                  className="group/row hover:bg-slate-50/40 transition-all duration-300"
                >
                  {/* Identity */}
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-5">
                      <div
                        className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 transition-all duration-500 
                        ${
                          user.status === "Active"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm"
                            : "bg-slate-50 border-slate-100 text-slate-300 opacity-60"
                        }`}
                      >
                 
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="h-full w-full rounded-2xl object-cover"
                          />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-900 group-hover/row:text-emerald-600 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center gap-8">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
                          <FaCode className="text-emerald-500/70 text-xs" />{" "}
                          {user.solvedQuestions || 0}
                        </div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                          Solved
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
                          <FaQuestionCircle className="text-blue-500/70 text-xs" />{" "}
                          {user.solvedQuizzes || 0}
                        </div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                          Quizzes
                        </span>
                      </div>
                    </div>
                  </td>

                 
                  <td className="px-10 py-6">
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[10px] font-black tracking-widest uppercase 
                      ${user.status === "Active" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${user.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                      ></span>
                      {user.status || "Active"}
                    </div>
                  </td>

               
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover/row:opacity-100 translate-x-4 group-hover/row:translate-x-0 transition-all duration-300">
                      <button
                        onClick={() =>
                          handleToggleStatus(user._id, user.status)
                        }
                        className={`p-3 rounded-xl border border-slate-100 transition-all hover:shadow-md ${user.status === "Active" ? "text-orange-500 hover:bg-orange-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                        title={user.status === "Active" ? "Block" : "Unblock"}
                      >
                        {user.status === "Active" ? (
                          <FaLock size={14} />
                        ) : (
                          <FaLockOpen size={14} />
                        )}
                      </button>
                      <button className="p-3 rounded-xl border border-slate-100 text-blue-600 hover:bg-blue-50 hover:shadow-md transition-all">
                        <FaUserEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-3 rounded-xl border border-slate-100 text-red-500 hover:bg-red-50 hover:shadow-md transition-all"
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

        
        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Registry Status
            </p>
            <p className="text-xs text-slate-600 font-bold">
              Showing{" "}
              <span className="text-slate-900">
                {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, users.length)}
              </span>{" "}
              of <span className="text-emerald-600">{users.length} Nodes</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-30 shadow-sm"
            >
              <FaChevronLeft size={12} />
            </button>

            <div className="flex items-center p-1.5 bg-white border border-slate-200 rounded-2xl gap-1 shadow-inner">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`h-10 px-5 rounded-xl text-[11px] font-black transition-all duration-300 ${
                    currentPage === i + 1
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </button>
              ))}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-30 shadow-sm"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
