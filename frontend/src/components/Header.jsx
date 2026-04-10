import React from "react";
import { FaRocket, FaCheckCircle, FaUsers, FaTerminal } from "react-icons/fa";

function Header({ activeUsers, activeUsersLoading }) {
  const activeText = activeUsersLoading
    ? "Loading..."
    : typeof activeUsers === "number"
      ? `${activeUsers} online now`
      : "- online now";

  return (
    <div className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-background transition-colors duration-500 pt-20">
      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col items-start text-left">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background-soft border border-primary mb-8 shadow-sm group cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-secondary group-hover:text-(--color-primary) transition-colors">
              v2.0 is now live
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter mb-6 leading-[1.05]">
            Build your <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-accent to-primary-dark">
              Legacy in Code.
            </span>
          </h1>

          <p className="text-md text-secondary font-medium max-w-lg mb-10 leading-relaxed">
            OrbitonCX brings teams together in a powerful real-time environment.
            Compile, debug, and ship with{" "}
            <span className="text-(--color-primary) font-bold">AI-powered</span>{" "}
            insights.
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <button className="px-8 py-3 rounded-2xl bg-(--text-color-primary) text-background font-bold text-[11px] uppercase tracking-widest hover:bg-primary hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/10 flex items-center gap-3 active:scale-95">
              Get Started Free <FaRocket />
            </button>
            <button className="px-8 py-3 rounded-2xl bg-background-soft border border-primary text-primary font-bold text-[11px] uppercase tracking-widest hover:border-(--color-primary) hover:text-(--color-primary) transition-all active:scale-95 shadow-sm">
              Live Demo
            </button>
          </div>

          <div className="mt-12 flex items-center gap-8">
            <div className="flex items-center gap-2.5 group">
              <FaCheckCircle className="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-black text-muted uppercase tracking-widest group-hover:text-secondary">
                Cloud Compiler
              </span>
            </div>
            <div className="flex items-center gap-2.5 group">
              <FaCheckCircle className="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-black text-muted uppercase tracking-widest group-hover:text-secondary">
                Real-time Sync
              </span>
            </div>
          </div>
        </div>

        <div className="relative hidden md:block group">
          <div className="relative z-20 bg-background-soft/40 backdrop-blur-2xl border border-secondary/50 rounded-[3rem] p-2 shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700">
            <div className="bg-[#0D0D10] rounded-[2.5rem] p-8 shadow-inner overflow-hidden border border-white/5">
              <div className="flex gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-lg shadow-rose-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-lg shadow-amber-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-lg shadow-emerald-500/20"></div>
              </div>

              <div className="font-mono text-sm space-y-3">
                <p className="text-indigo-400">
                  const <span className="text-white">orbiton</span> ={" "}
                  <span className="text-pink-500">async</span> () =&gt; &#123;
                </p>
                <p className="text-secondary ml-5">
                  <span className="text-pink-500">await</span>{" "}
                  <span className="text-blue-400">connect</span>(team);
                </p>
                <p className="text-secondary ml-5">
                  <span className="text-pink-500">return</span>{" "}
                  <span className="text-emerald-400">
                    "Deployment Successful"
                  </span>
                  ;
                </p>
                <p className="text-indigo-400">&#125;;</p>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-400/80">
                    <FaTerminal size={10} />
                    <span>Console: Build successful in 42ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -top-8 -right-8 z-30 bg-background-soft p-5 rounded-3xl shadow-2xl border border-primary animate-bounce duration-4000">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-(--color-primary) shadow-inner">
                <FaUsers size={20} />
              </div>
              <div>
                <p className="text-[9px] text-(--color-primary) font-black uppercase tracking-widest leading-none mb-1">
                  Active Users
                </p>
                <p className="text-sm font-black text-primary tracking-tight">
                  {activeText}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-primary opacity-20 blur-[100px] -z-10 group-hover:opacity-30 transition-opacity"></div>
        </div>
      </div>
    </div>
  );
}

export default Header;
