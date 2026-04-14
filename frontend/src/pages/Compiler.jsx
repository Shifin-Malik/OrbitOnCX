import React, { useState, useEffect, useMemo, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  runCodeAction,
  clearOutput,
  loadDraftAction,
  saveDraftAction,
  setCode,
} from "../features/compiler/compilerSlice.js";
import {
  HiPlay,
  HiTrash,
  HiTerminal,
  HiChevronDown,
  HiSparkles,
  HiArrowLeft,
  HiMoon,
  HiSun,
} from "react-icons/hi";
import {
  SiJavascript,
  SiPython,
  SiCplusplus,
  SiOpenjdk,
  SiGo,
  SiRust,
  SiPhp,
} from "react-icons/si";

import AIChatbot from "../components/AIChatbot.jsx";

const Compiler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const {
    code,
    output: reduxOutput,
    compiling,
    loadingDraft,
    isInitialized,
    error,
  } = useSelector((state) => state.compiler);

  const [activeTab, setActiveTab] = useState("console");
  const [aiQuery, setAiQuery] = useState("");

  // 🔴 THEME TOGGLE STATE
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const languages = useMemo(
    () => [
      {
        id: "javascript",
        name: "JavaScript",
        icon: <SiJavascript />,
        ext: "js",
        defaultCode: `// OrbitonCX JS\nconsole.log("Hello, Universe!");`,
      },
      {
        id: "python",
        name: "Python",
        icon: <SiPython />,
        ext: "py",
        defaultCode: `# OrbitonCX Python\nprint("Hello, Universe!")`,
      },
      {
        id: "java",
        name: "Java",
        icon: <SiOpenjdk />,
        ext: "java",
        defaultCode: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, Universe!");\n  }\n}`,
      },
      {
        id: "cpp",
        name: "cpp",
        nameDisplay: "C++",
        icon: <SiCplusplus />,
        ext: "cpp",
        defaultCode: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, Universe!" << std::endl;\n    return 0;\n}`,
      },
      {
        id: "c",
        name: "c",
        nameDisplay: "C",
        icon: <SiCplusplus />,
        ext: "c",
        defaultCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello, Universe!\\n");\n    return 0;\n}`,
      },
      {
        id: "go",
        name: "go",
        nameDisplay: "Go",
        icon: <SiGo />,
        ext: "go",
        defaultCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Universe!")\n}`,
      },
      {
        id: "rust",
        name: "rust",
        nameDisplay: "Rust",
        icon: <SiRust />,
        ext: "rs",
        defaultCode: `fn main() {\n    println!("Hello, Universe!");\n}`,
      },
      {
        id: "php",
        name: "php",
        nameDisplay: "PHP",
        icon: <SiPhp />,
        ext: "php",
        defaultCode: `<?php\necho "Hello, Universe!";\n?>`,
      },
    ],
    [],
  );

  const [language, setLanguage] = useState("javascript");
  const [editorTheme, setEditorTheme] = useState(
    isDarkMode ? "vs-dark" : "light",
  );

  const currentLang = useMemo(
    () => languages.find((l) => l.id === language),
    [languages, language],
  );
  const editorLanguage =
    language === "cpp" ? "cpp" : language === "c" ? "c" : language;

  // 🔴 THEME TOGGLE HANDLER
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    setIsDarkMode(isDark);
    setEditorTheme(isDark ? "vs-dark" : "light");
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
      setEditorTheme(isDark ? "vs-dark" : "light");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    dispatch(clearOutput());
    if (user?._id) {
      dispatch(loadDraftAction({ userId: user._id, language }));
    } else {
      dispatch(setCode(currentLang?.defaultCode || ""));
    }
  }, [dispatch, authLoading, user?._id, language, currentLang]);

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

  const handleLanguageChange = (e) => setLanguage(e.target.value);
  const handleEditorChange = useCallback(
    (value) => dispatch(setCode(value || "")),
    [dispatch],
  );

  const runCode = useCallback(() => {
    dispatch(runCodeAction({ language, code, userId: user?._id || null }));
    setActiveTab("console");
  }, [dispatch, language, code, user?._id]);

  const handleAskAIAboutError = () => {
    setActiveTab("ai");
    setAiQuery(
      `I got this error when running my ${currentLang.name} code. Can you explain what went wrong and give me a hint to fix it?\n\nError:\n${error}`,
    );
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-2 font-sans bg-[var(--color-background)] text-[var(--text-color-primary)] transition-colors duration-300">
      <div className="w-full max-w-[1450px] h-[95vh] flex flex-col bg-[var(--color-background-soft)] rounded-[2rem] overflow-hidden border border-[var(--border-color-primary)] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] transition-all duration-500">
        {/* HEADER SECTION */}
        <div className="h-16 px-6 flex items-center justify-between bg-[var(--color-background-elevated)]/80 backdrop-blur-md border-b border-[var(--border-color-primary)] shrink-0 z-10">
          <div className="flex items-center gap-6">
            {/* BACK BUTTON */}
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-[var(--text-color-muted)] hover:text-[var(--color-primary)] transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 bg-[var(--color-background-soft)] px-3 py-2 rounded-xl border border-transparent hover:border-[var(--border-color-primary)]"
            >
              <HiArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span className="hidden sm:block">Back</span>
            </button>

            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-[var(--color-background-soft)] text-[var(--text-color-muted)] hover:text-[var(--color-primary)] border border-[var(--border-color-primary)] transition-all hover:scale-105 active:scale-95"
              title="Toggle Theme"
            >
              {isDarkMode ? <HiSun size={16} /> : <HiMoon size={16} />}
            </button>

            <div className="h-6 w-px bg-[var(--border-color-primary)] hidden sm:block"></div>

            {/* LANGUAGE SELECTOR */}
            <div className="relative flex items-center bg-[var(--color-background)] rounded-xl border border-[var(--border-color-primary)] hover:border-[var(--color-primary)] transition-all overflow-hidden shadow-sm group">
              <div className="flex items-center pl-4 pointer-events-none text-[var(--color-primary)] text-lg group-hover:scale-110 transition-transform">
                {currentLang?.icon}
              </div>
              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-transparent pl-3 pr-10 py-2.5 text-xs font-bold text-[var(--text-color-primary)] outline-none cursor-pointer appearance-none capitalize tracking-widest z-10"
              >
                {languages.map((lang) => (
                  <option
                    key={lang.id}
                    value={lang.id}
                    className="bg-[var(--color-background-soft)] text-[var(--text-color-primary)]"
                  >
                    {lang.nameDisplay || lang.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 pointer-events-none">
                <HiChevronDown className="text-[var(--text-color-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
              </div>
            </div>
          </div>

          {/* RUN BUTTON */}
          <button
            onClick={runCode}
            disabled={compiling || loadingDraft}
            className="relative overflow-hidden bg-[var(--color-primary)] text-white px-8 py-2.5 rounded-xl font-black text-[10px] tracking-[0.25em] hover:bg-[var(--color-primary-dark)] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {compiling ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <HiPlay
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
            )}
            <span className="relative z-10">
              {compiling ? "EXECUTING" : "RUN CODE"}
            </span>
          </button>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[var(--color-background)]">
          {/* CODE EDITOR */}
          <div className="flex-[3] relative border-b lg:border-b-0 lg:border-r border-[var(--border-color-primary)] pt-2">
            <Editor
              height="100%"
              theme={editorTheme}
              language={editorLanguage}
              value={code}
              onChange={handleEditorChange}
              options={{
                fontSize: 15,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                padding: { top: 16 },
                lineNumbers: "on",
                scrollbar: {
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
              }}
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-[2] min-w-[380px] flex flex-col bg-[var(--color-background-soft)]">
            {/* TABS HEADER */}
            <div className="flex border-b border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] p-1.5 gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab("console")}
                className={`relative flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-300 ${
                  activeTab === "console"
                    ? "text-[var(--color-primary)] bg-[var(--color-primary-glow,rgba(16,185,129,0.1))] shadow-sm"
                    : "text-[var(--text-color-muted)] hover:text-[var(--text-color-primary)] hover:bg-[var(--color-background-soft)]"
                }`}
              >
                <HiTerminal size={16} /> Console Output
                {activeTab === "console" && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-[var(--color-primary)] rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("ai")}
                className={`relative flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-300 ${
                  activeTab === "ai"
                    ? "text-[var(--color-accent)] bg-[var(--color-accent-glow,rgba(52,211,153,0.1))] shadow-sm"
                    : "text-[var(--text-color-muted)] hover:text-[var(--text-color-primary)] hover:bg-[var(--color-background-soft)]"
                }`}
              >
                <HiSparkles
                  size={16}
                  className={activeTab === "ai" ? "animate-pulse" : ""}
                />{" "}
                AI Assistant
                {activeTab === "ai" && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-[var(--color-accent)] rounded-t-full" />
                )}
              </button>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === "console" ? (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="absolute top-2 right-4 z-10">
                  <button
                    onClick={() => dispatch(clearOutput())}
                    className="p-2 bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] text-[var(--text-color-muted)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] rounded-lg transition-all shadow-sm"
                    title="Clear Terminal"
                  >
                    <HiTrash size={14} />
                  </button>
                </div>

                <div className="flex-1 p-6 pt-12 font-mono text-[13px] overflow-y-auto leading-relaxed bg-[#050505] shadow-inner text-[#f8fafc]">
                  {error ? (
                    <div className="flex flex-col items-start gap-5 animate-in fade-in duration-300">
                      <div className="w-full p-4 rounded-xl bg-[var(--color-danger-glow)] border border-[var(--color-danger)]/30 text-[var(--color-danger)]">
                        <div className="flex items-center gap-2 mb-2 font-black text-[10px] tracking-widest uppercase">
                          <div className="w-2 h-2 rounded-full bg-[var(--color-danger)] animate-pulse"></div>
                          Execution Failed
                        </div>
                        <pre className="whitespace-pre-wrap font-medium">
                          {error}
                        </pre>
                      </div>

                      <button
                        onClick={handleAskAIAboutError}
                        className="group relative overflow-hidden flex items-center gap-3 bg-[var(--color-accent-glow)] border border-[var(--color-accent)]/30 px-5 py-3 rounded-xl text-xs font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-all shadow-sm"
                      >
                        <HiSparkles
                          size={16}
                          className="group-hover:animate-spin"
                        />
                        <span>Ask AI to explain this error</span>
                      </button>
                    </div>
                  ) : reduxOutput ? (
                    <pre className="whitespace-pre-wrap text-[var(--color-success)] font-medium animate-in fade-in">
                      {reduxOutput}
                    </pre>
                  ) : (
                    <div className="h-full flex items-center justify-center select-none">
                      <div className="flex flex-col items-center gap-3 opacity-30 text-[#94a3b8]">
                        <HiTerminal size={32} />
                        <span className="text-[10px] font-black tracking-[0.5em] uppercase">
                          {compiling ? "Running Code..." : "Awaiting Execution"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden bg-[var(--color-background)]">
                <AIChatbot
                  code={code}
                  language={language}
                  compilerOutput={error || reduxOutput || ""}
                  error={error}
                  externalQuery={aiQuery}
                  clearExternalQuery={() => setAiQuery("")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compiler;
