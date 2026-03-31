import React from "react";

const Modal = ({ children, onClose, title, className = "max-w-90" }) => (
  <div className="fixed inset-0 z-150 flex items-center justify-center p-6 bg-black/10 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
    <div className="absolute inset-0" onClick={onClose}></div>

    <div
      className={`relative bg-background-soft border border-primary rounded-3xl p-5 w-full shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 ${className}`}
    >
      <div className="flex justify-between items-center mb-5 px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
          {title}
        </h3>
        <button
          onClick={onClose}
          className="group p-1 transition-all active:scale-90"
        >
          <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-background-elevated text-muted group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-colors">
            <span className="text-[10px]">✕</span>
          </div>
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default Modal;
