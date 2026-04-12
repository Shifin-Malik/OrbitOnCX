import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  blockUser,
  getAllUsers,
  getUserDetails,
  presenceBulkSync,
  presenceUserOffline,
  presenceUserOnline,
  softDeleteUser,
  unblockUser,
} from "../../features/admin/adminSlice.js";
import UserDetailsModal from "../../components/admin/UserDetailsModal.jsx";
import { createAppSocket } from "../../services/socket.js";
import {
  FaTrash,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaLock,
  FaLockOpen,
  FaSearch,
  FaEye,
  FaCircle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const UserManagement = () => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const {
    users = [],
    loading,
    pagination,
  } = useSelector((state) => state.admin);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(
      getAllUsers({
        page: currentPage,
        limit: 5,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      }),
    );
  }, [dispatch, currentPage, debouncedSearch, roleFilter, statusFilter]);

  const handleToggleBlock = async (user) => {
    setProcessingId(user._id);
    if (user.status === "Deleted" || user.isDeleted) {
      toast.error("User is deleted");
      setProcessingId(null);
      return;
    }
    const isBlocked = user.status === "Blocked" || user.isBlocked;
    try {
      if (isBlocked) {
        await dispatch(unblockUser(user._id)).unwrap();
        toast.success("Access Restored");
      } else {
        await dispatch(blockUser(user._id)).unwrap();
        toast.error("Access Restricted");
      }
    } catch (err) {
      toast.error("Action Failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSoftDelete = async (user) => {
    setProcessingId(user._id);
    try {
      await dispatch(softDeleteUser(user._id)).unwrap();
      toast.success("User Deleted");
    } catch (err) {
      toast.error("Delete Failed");
    } finally {
      setProcessingId(null);
    }
  };

  // Socket logic remains unchanged
  useEffect(() => {
    socketRef.current = createAppSocket();
    socketRef.current.on("user:online", (p) => dispatch(presenceUserOnline(p)));
    socketRef.current.on("user:offline", (p) =>
      dispatch(presenceUserOffline(p)),
    );
    socketRef.current.on("presence:bulk-sync", (p) =>
      dispatch(presenceBulkSync(p)),
    );
    return () => {
      socketRef.current?.disconnect();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!socketRef.current) return;
    const userIds = (users || []).map((u) => u._id).filter(Boolean);
    socketRef.current.emit("presence:bulk-sync", { userIds });
  }, [users]);

  if (loading && users.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="h-12 w-12 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-4 lg:p-7 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 px-1">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-color-primary)] tracking-tighter uppercase italic leading-none">
            ORBITON{" "}
            <span className="text-[var(--color-primary)] not-italic">
              ARENA
            </span>
          </h2>
          <p className="text-[12px] text-[var(--text-color-muted)] font-bold tracking-[0.25em] uppercase mt-1.5">
            Registry Control Terminal
          </p>
        </div>
        <button className="flex items-center gap-3 bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-black text-[12px] uppercase hover:bg-[var(--color-primary-dark)] transition-all active:scale-95 shadow-xl">
          <FaPlus size={10} /> New Entry
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            val: pagination?.totalUsers || 0,
            color: "text-[var(--text-color-primary)]",
          },
          {
            label: "Active",
            val: users.filter((u) => u.status !== "Blocked").length,
            color: "text-[var(--color-primary)]",
          },
          {
            label: "Admins",
            val: users.filter((u) => u.role === "admin").length,
            color: "text-[var(--color-accent)]",
          },
          {
            label: "Blocked",
            val: users.filter((u) => u.status === "Blocked").length,
            color: "text-[var(--color-danger)]",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] p-4 rounded-[1.5rem] shadow-sm"
          >
            <p className="text-[10px] font-black text-[var(--text-color-muted)] uppercase tracking-widest mb-1.5">
              {s.label}
            </p>
            <p className={`text-2xl font-black tracking-tight ${s.color}`}>
              {s.val}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--color-background-soft)] p-3 rounded-[1.8rem] border border-[var(--border-color-primary)] flex flex-col md:flex-row gap-3 shadow-sm">
        <div className="flex-1 relative group">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
          <input
            type="text"
            placeholder="SEARCH IDENTITY..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl text-[12px] font-bold text-[var(--text-color-primary)] outline-none focus:border-[var(--color-primary)] transition-all"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] px-5 py-3.5 rounded-xl text-[10px] font-black uppercase text-[var(--text-color-primary)] outline-none cursor-pointer"
          >
            <option value="all">Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] px-5 py-3.5 rounded-xl text-[10px] font-black uppercase text-[var(--text-color-primary)] outline-none cursor-pointer"
          >
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-background-soft)] rounded-[2.2rem] border border-[var(--border-color-primary)] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-background-elevated)] border-b border-[var(--border-color-primary)]">
                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                  Entity Signature
                </th>
                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                  Role
                </th>
                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)] text-center">
                  Status
                </th>
                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)] text-right">
                  Operations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color-primary)]">
              {users.map((user) => {
                const statusText =
                  user.status || (user.isBlocked ? "Blocked" : "Active");
                const isBlocked =
                  statusText === "Blocked" || statusText === "Deleted";
                const isProcessing = processingId === user._id;

                return (
                  <tr
                    key={user._id}
                    className="group hover:bg-[var(--color-background-elevated)] transition-colors duration-300"
                  >
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-[1rem] bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] flex items-center justify-center font-black text-[12px] text-[var(--color-primary)]">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              className="h-full w-full object-cover rounded-[1rem]"
                            />
                          ) : (
                            user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-[var(--text-color-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                            {user.name}
                          </p>
                          <p className="text-[10px] font-bold text-[var(--text-color-muted)] tracking-tight lowercase">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-4">
                      <span
                        className={`text-[9px] font-black uppercase px-2.5 py-1 rounded border ${user.role === "admin" ? "bg-[var(--color-accent-glow)] border-[var(--color-accent)] text-[var(--color-accent)]" : "bg-[var(--color-background-elevated)] border-[var(--border-color-primary)] text-[var(--text-color-muted)]"}`}
                      >
                        {user.role || "user"}
                      </span>
                    </td>
                    <td className="px-7 py-4 text-center">
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${isBlocked ? "text-[var(--color-danger)] bg-[var(--color-danger-glow)] border-[var(--color-danger)]" : "text-[var(--color-success)] bg-[var(--color-success-glow)] border-[var(--color-success)]"}`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${isBlocked ? "bg-[var(--color-danger)]" : "bg-[var(--color-success)] animate-pulse"}`}
                        ></div>
                        {statusText}
                      </div>
                    </td>
                    <td className="px-7 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            dispatch(getUserDetails(user._id));
                          }}
                          className="p-2.5 rounded-xl bg-[var(--color-background-elevated)] text-[var(--text-color-muted)] hover:text-[var(--color-primary)] transition-all border border-[var(--border-color-primary)] shadow-sm"
                        >
                          <FaEye size={12} />
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleToggleBlock(user)}
                          className={`p-2.5 rounded-xl transition-all border ${isBlocked ? "bg-[var(--color-success-glow)] border-[var(--color-success)] text-[var(--color-success)]" : "bg-[var(--color-background-elevated)] border-[var(--border-color-primary)] text-[var(--text-color-muted)] hover:text-[var(--color-danger)]"}`}
                        >
                          {isProcessing ? (
                            <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : isBlocked ? (
                            <FaLockOpen size={12} />
                          ) : (
                            <FaLock size={12} />
                          )}
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleSoftDelete(user)}
                          className="p-2.5 rounded-xl bg-[var(--color-background-elevated)] text-[var(--text-color-muted)] hover:bg-[var(--color-danger)] hover:text-white transition-all border border-[var(--border-color-primary)] shadow-sm"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-5 bg-[var(--color-background-elevated)] border-t border-[var(--border-color-primary)] flex justify-between items-center">
          <span className="text-[10px] font-black text-[var(--text-color-muted)] uppercase tracking-[0.2em]">
            Index {currentPage} / {pagination?.totalPages || 1}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[var(--text-color-primary)] hover:border-[var(--color-primary)] transition-all disabled:opacity-20 shadow-lg"
            >
              <FaChevronLeft size={10} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= pagination?.totalPages}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[var(--text-color-primary)] hover:border-[var(--color-primary)] transition-all disabled:opacity-20 shadow-lg"
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
