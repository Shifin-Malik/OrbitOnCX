import React from "react";
import { FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";

const UserListModal = ({ isOpen, onClose, title, users }) => {
  if (!isOpen) return null;
  console.log(users);
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-background-soft border border-primary rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-primary/40 flex justify-between items-center bg-background/50">
          <h3 className="text-xl font-black text-primary uppercase tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-full transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="max-h-100 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {users && users.length > 0 ? (
            users.map((u, index) => (
              <Link
                key={u._id || index}
                to={`/profile/${u._id}`}
                onClick={onClose}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
              >
                <img
                  src={
                    u.profilePic ||
                    u.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${u._id || u.name}`
                  }
                  className="w-12 h-12 rounded-xl bg-background border border-primary object-cover"
                  alt={u.name}
                />
                <div className="flex flex-col">
                  <span className="font-bold text-primary group-hover:text-primary transition-colors line-clamp-1">
                    {u.name}
                  </span>
                  <span className="text-xs text-muted font-medium">
                    View Profile
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-10 text-center text-muted font-medium italic">
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
