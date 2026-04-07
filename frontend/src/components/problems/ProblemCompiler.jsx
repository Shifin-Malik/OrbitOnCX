import React, { useState, useEffect, useMemo, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useDispatch, useSelector } from "react-redux";
import {
  runCodeAction,
  clearOutput,
  loadDraftAction,
  saveDraftAction,
  setCode,
} from "../../features/compiler/compilerSlice";
import {
  HiPlay,
  HiTrash,
  HiTerminal,
  HiChevronLeft,
  HiCloudUpload,
} from "react-icons/hi";

const ProblemCompiler = ({ problem, onBack }) => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { code, output, compiling, loadingDraft, isInitialized, error } =
    useSelector((state) => state.compiler);

  const [language, setLanguage] = useState("javascript");
  const [editorTheme, setEditorTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "vs-dark" : "light",
  );


  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setEditorTheme(isDark ? "vs-dark" : "light");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    dispatch(clearOutput());
    if (user?._id) {
      dispatch(loadDraftAction({ userId: user._id, language }));
    }
  }, [dispatch, user?._id, language]);

  // Auto-save
  useEffect(() => {
    if (
      !user?._id ||
      loadingDraft ||
      !isInitialized ||
      typeof code !== "string"
    )
      return;
    const timer = setTimeout(() => {
      dispatch(saveDraftAction({ userId: user._id, language, code }));
    }, 1500);
    return () => clearTimeout(timer);
  }, [dispatch, user?._id, language, code, loadingDraft, isInitialized]);

  const handleEditorChange = useCallback(
    (value) => {
      dispatch(setCode(value || ""));
    },
    [dispatch],
  );

  const runCode = () => {
    dispatch(runCodeAction({ language, code, userId: user?._id || null }));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-background)] animate-in fade-in duration-500 overflow-hidden fixed inset-0 z-[100]">
      
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color-primary)] bg-[var(--color-background-soft)] shrink-0 shadow-sm">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className="group p-2 hover:bg-[var(--color-background-elevated)] rounded-xl transition-all text-[var(--text-color-muted)] hover:text-[var(--color-primary)]"
          >
            <HiChevronLeft
              size={22}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest leading-none mb-1">
              {problem.difficulty} Arena
            </span>
            <h2 className="text-sm font-black text-[var(--text-color-primary)] tracking-tight uppercase">
              {problem.id}. {problem.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
        
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-background-elevated)] rounded-xl border border-[var(--border-color-primary)]">
            <span className="text-[9px] font-black text-[var(--text-color-muted)] uppercase tracking-widest">
              Lang:
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase text-[var(--text-color-secondary)] outline-none cursor-pointer"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="h-6 w-[1px] bg-[var(--border-color-primary)] mx-1" />

          <button
            onClick={runCode}
            disabled={compiling}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-color-secondary)] hover:border-[var(--color-primary)]/50 transition-all active:scale-95 disabled:opacity-50"
          >
            {compiling ? (
              <div className="w-3 h-3 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <HiPlay className="text-[var(--color-primary)]" size={16} />
            )}
            Run
          </button>

          <button className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[var(--color-primary)]/20 hover:brightness-110 transition-all active:scale-95">
            <HiCloudUpload size={16} />
            Submit
          </button>
        </div>
      </div>

   
      <div className="flex flex-1 overflow-hidden">
   
        <div className="w-[40%] flex flex-col border-r border-[var(--border-color-primary)] bg-[var(--color-background)]">
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
            <div className="prose prose-invert max-w-none">
              <h1 className="text-2xl font-black text-[var(--text-color-primary)] mb-6 tracking-tighter uppercase">
                Problem{" "}
                <span className="text-[var(--color-primary)]">Description</span>
              </h1>

              <div className="text-[var(--text-color-secondary)] leading-relaxed space-y-6 text-[15px] font-medium">
                <p>
                  Given an array of integers{" "}
                  <code className="bg-[var(--color-background-elevated)] px-2 py-0.5 rounded text-[var(--color-primary)] font-mono">
                    nums
                  </code>{" "}
                  and an integer{" "}
                  <code className="bg-[var(--color-background-elevated)] px-2 py-0.5 rounded text-[var(--color-primary)] font-mono">
                    target
                  </code>
                  , return indices of the two numbers such that they add up to
                  target.
                </p>

                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-color-muted)]">
                    Example 01
                  </h4>
                  <div className="bg-[var(--color-background-soft)] p-6 rounded-3xl border border-[var(--border-color-primary)] font-mono text-xs space-y-3">
                    <div>
                      <p className="text-[var(--text-color-muted)] mb-1">
                        // Input
                      </p>
                      <p className="text-[var(--text-color-primary)]">
                        nums = [2, 7, 11, 15], target = 9
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[var(--border-color-primary)]">
                      <p className="text-[var(--text-color-muted)] mb-1">
                        // Output
                      </p>
                      <p className="text-[var(--color-primary)]">[0, 1]</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="flex-1 flex flex-col bg-[#050505]">
      
          <div className="px-5 py-2 bg-[#0d0d0d] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-white/5 rounded-t-lg border-b-2 border-[var(--color-primary)] text-[10px] font-black text-white uppercase tracking-widest">
                solution.{language === "python" ? "py" : "js"}
              </div>
            </div>
            <span className="text-[9px] text-white/20 font-mono">
              OrbitonCX_v2.0
            </span>
          </div>


          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme={editorTheme}
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={handleEditorChange}
              options={{
                fontSize: 15,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                padding: { top: 20 },
                lineNumbers: "on",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          </div>

   
          <div className="h-1/3 bg-[#080808] border-t border-white/10 flex flex-col shadow-2xl">
            <div className="px-6 py-2 bg-[#0d0d0d] flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <HiTerminal size={14} className="text-[var(--color-primary)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                  Output Terminal
                </span>
              </div>
              <button
                onClick={() => dispatch(clearOutput())}
                className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-red-400 transition-all"
              >
                <HiTrash size={14} />
              </button>
            </div>
            <div className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar">
              {error ? (
                <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
              ) : output ? (
                <pre className="text-green-400 whitespace-pre-wrap">
                  {output}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center opacity-10">
                  <span className="text-[10px] font-black uppercase tracking-[1em]">
                    Idle
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-1.5 bg-[var(--color-primary)] flex items-center justify-between text-[9px] font-black text-white uppercase tracking-[0.1em]">
            <div className="flex gap-4">
              <span>Status: Ready</span>
              <span className="opacity-60">{language}</span>
            </div>
            <div className="opacity-80">
              {user ? user.name : "Guest"}@OrbitonCX
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemCompiler;
