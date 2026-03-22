import React from "react";
import { FaRocket, FaCheckCircle, FaUsers, FaTerminal } from "react-icons/fa";

function Header() {
  return (
    <div className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-[var(--color-background)] transition-colors duration-500 pt-20">
      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
       
        <div className="flex flex-col items-start text-left">
         
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] mb-8 shadow-sm group cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-color-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
              v2.0 is now live
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-[var(--text-color-primary)] tracking-tighter mb-6 leading-[1.05]">
            Build your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary-dark)]">
              Legacy in Code.
            </span>
          </h1>

          <p className="text-lg text-[var(--text-color-secondary)] font-medium max-w-lg mb-10 leading-relaxed">
            OrbitonCX brings teams together in a powerful real-time environment.
            Compile, debug, and ship with{" "}
            <span className="text-[var(--color-primary)] font-bold">
              AI-powered
            </span>{" "}
            insights.
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <button className="px-8 py-4 rounded-2xl bg-[var(--text-color-primary)] text-[var(--color-background)] font-bold text-[11px] uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/10 flex items-center gap-3 active:scale-95">
              Get Started Free <FaRocket />
            </button>
            <button className="px-8 py-4 rounded-2xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[var(--text-color-primary)] font-bold text-[11px] uppercase tracking-widest hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all active:scale-95 shadow-sm">
              Live Demo
            </button>
          </div>

         
          <div className="mt-12 flex items-center gap-8">
            <div className="flex items-center gap-2.5 group">
              <FaCheckCircle className="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-[var(--text-color-muted)] uppercase tracking-widest group-hover:text-[var(--text-color-secondary)]">
                Cloud Compiler
              </span>
            </div>
            <div className="flex items-center gap-2.5 group">
              <FaCheckCircle className="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-[var(--text-color-muted)] uppercase tracking-widest group-hover:text-[var(--text-color-secondary)]">
                Real-time Sync
              </span>
            </div>
          </div>
        </div>

        
        <div className="relative hidden lg:block group">
        
          <div className="relative z-20 bg-[var(--color-background-soft)]/40 backdrop-blur-2xl border border-[var(--border-color-secondary)]/50 rounded-[3rem] p-4 shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700">
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
                <p className="text-[var(--text-color-secondary)] ml-5">
                  <span className="text-pink-500">await</span>{" "}
                  <span className="text-blue-400">connect</span>(team);
                </p>
                <p className="text-[var(--text-color-secondary)] ml-5">
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

          
          <div className="absolute -top-8 -right-8 z-30 bg-[var(--color-background-soft)] p-5 rounded-3xl shadow-2xl border border-[var(--border-color-primary)] animate-bounce duration-[4000ms]">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)] shadow-inner">
                <FaUsers size={20} />
              </div>
              <div>
                <p className="text-[9px] text-[var(--color-primary)] font-black uppercase tracking-widest leading-none mb-1">
                  Active Now
                </p>
                <p className="text-sm font-black text-[var(--text-color-primary)] tracking-tight">
                  12 Developers
                </p>
              </div>
            </div>
          </div>

         
          <div className="absolute inset-0 bg-[var(--color-primary)] opacity-20 blur-[100px] -z-10 group-hover:opacity-30 transition-opacity"></div>
        </div>
      </div>
    </div>
  );
}

export default Header;
