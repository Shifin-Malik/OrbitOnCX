import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers } from "../../features/admin/adminSlice.js";
import UserDetailsModal from "../../components/admin/UserDetailsModal.jsx";
import {
  FaTrash,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaLock,
  FaLockOpen,
  FaSearch,
  FaFilter,
  FaEye,
  FaShieldAlt,
  FaCircle,
} from "react-icons/fa";

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users = [], loading } = useSelector((state) => state.admin);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole =
        roleFilter === "all" || (user.role || "user") === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (user.status || "Active").toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage,
  );

  const paginate = (n) => n >= 1 && n <= totalPages && setCurrentPage(n);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background p-2 lg:p-2 space-y-4 animate-in fade-in duration-700">
      {/* Header: Command Center Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex items-center justify-center">
              <span className="absolute h-4 w-4 bg-primary/30 rounded-full animate-ping"></span>
              <FaCircle className="text-primary relative z-10" size={8} />
            </div>
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">
              Operational Oversight
            </p>
          </div>
          <h2 className="text-4xl font-black text-accent tracking-tighter italic uppercase leading-none">
            ORBITON{" "}
            <span className="text-text-muted not-italic text-primary font-thin">
              ARENA
            </span>
          </h2>
        </div>
        <button className="group flex items-center gap-3 bg-text-primary text-background px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95 shadow-xl">
          <FaPlus
            size={10}
            className="group-hover:rotate-90 transition-transform"
          />{" "}
          New Candidate
        </button>
      </div>

      {/* Stats Nodes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Nodes", val: users.length, color: "text-accent" },
          {
            label: "Active Pulse",
            val: users.filter((u) => u.status === "Active").length,
            color: "text-primary",
          },
          { label: "New Joiners", val: 12, color: "text-text-primary" },
          { label: "Efficiency", val: "94.2%", color: "text-success" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-background-soft p-5 rounded-[2rem] border border-[var(--border-color-primary)] shadow-sm hover:border-primary/50 transition-all group"
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 group-hover:text-primary transition-colors">
              {stat.label}
            </p>
            <p className={`text-3xl font-black tracking-tighter ${stat.color}`}>
              {stat.val}
            </p>
          </div>
        ))}
      </div>

      {/* Control Bar: Floating Glassmorphism */}
      <div className="bg-background-soft p-3 rounded-3xl border border-[var(--border-color-primary)] shadow-lg flex flex-col lg:flex-row gap-3 items-center">
        <div className="flex-1 w-full relative">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search identity by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-background-elevated border border-[var(--border-color-primary)] rounded-2xl text-[11px] font-bold text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 lg:flex-none bg-background-soft border border-[var(--border-color-primary)] px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-primary outline-none cursor-pointer hover:bg-background-elevated transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 lg:flex-none bg-background-soft border border-[var(--border-color-primary)] px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-primary outline-none cursor-pointer hover:bg-background-elevated transition-colors"
          >
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table: Compact & Cinematic */}
      <div className="bg-background-soft rounded-[2.5rem] border border-[var(--border-color-primary)] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-background-elevated border-b border-[var(--border-color-primary)]">
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
                  Candidate Entity
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
                  Role
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted text-center">
                  Output
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
                  Connectivity
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color-primary)]">
              {currentUsers.map((user) => (
                <tr
                  key={user._id}
                  className="group hover:bg-background-elevated transition-all duration-300"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-background-elevated flex items-center justify-center font-black text-sm text-text-primary border border-[var(--border-color-primary)] overflow-hidden group-hover:scale-110 transition-transform">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-text-primary leading-tight">
                          {user.name}
                        </p>
                        <p className="text-[10px] font-bold text-text-muted">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-[var(--border-color-primary)] ${
                        user.role === "admin"
                          ? "bg-accent-glow text-accent"
                          : "bg-background text-text-secondary"
                      }`}
                    >
                      {user.role || "user"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-[11px] font-black text-text-primary">
                        {user.solvedQuestions || 0}
                      </span>
                      <span className="text-[7px] font-black uppercase text-text-muted tracking-tighter">
                        Solved
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border-color-primary)] text-[8px] font-black uppercase tracking-widest ${
                        user.status === "Active"
                          ? "bg-success-glow text-success"
                          : "bg-danger-glow text-danger"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.status === "Active"
                            ? "bg-success animate-pulse"
                            : "bg-danger"
                        }`}
                      ></span>
                      {user.status || "Active"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2.5 rounded-xl border border-[var(--border-color-primary)] text-text-muted hover:text-blue-500 hover:bg-background-elevated transition-all"
                      >
                        <FaEye size={12} />
                      </button>
                      <button className="p-2.5 rounded-xl border border-[var(--border-color-primary)] text-text-muted hover:text-accent hover:bg-background-elevated transition-all">
                        <FaShieldAlt size={12} />
                      </button>
                      <button className="p-2.5 rounded-xl border border-[var(--border-color-primary)] text-text-muted hover:text-danger hover:bg-danger-glow transition-all">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mini Pagination: High Density */}
        <div className="px-8 py-5 bg-background-elevated border-t border-[var(--border-color-primary)] flex justify-between items-center">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
            Registry Index{" "}
            <span className="text-text-primary mx-2">
              {currentPage} / {totalPages || 1}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-10 w-10 flex items-center justify-center rounded-2xl bg-background-soft border border-[var(--border-color-primary)] text-text-muted hover:text-primary disabled:opacity-30 transition-all"
            >
              <FaChevronLeft size={10} />
            </button>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-10 w-10 flex items-center justify-center rounded-2xl bg-background-soft border border-[var(--border-color-primary)] text-text-muted hover:text-primary disabled:opacity-30 transition-all"
            >
              <FaChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>

      <UserDetailsModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default UserManagement;
