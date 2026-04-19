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
  const [language, setLanguage] = useState("javascript");

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [editorTheme, setEditorTheme] = useState(
    document.documentElement.classList.contains("dark") ? "vs-dark" : "light",
  );

  const languages = useMemo(
    () => [
      {
        id: "javascript",
        name: "JavaScript",
        icon: <SiJavascript />,
        nameDisplay: "JavaScript",
        defaultCode: `// OrbitonCX JS
console.log("Hello, Universe!");`,
      },
      {
        id: "python",
        name: "Python",
        icon: <SiPython />,
        nameDisplay: "Python",
        defaultCode: `# OrbitonCX Python
print("Hello, Universe!")`,
      },
      {
        id: "java",
        name: "Java",
        icon: <SiOpenjdk />,
        nameDisplay: "Java",
        defaultCode: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Universe!");
  }
}`,
      },
      {
        id: "cpp",
        name: "cpp",
        nameDisplay: "C++",
        icon: <SiCplusplus />,
        defaultCode: `#include <iostream>

int main() {
  std::cout << "Hello, Universe!" << std::endl;
  return 0;
}`,
      },
      {
        id: "c",
        name: "c",
        nameDisplay: "C",
        icon: <SiCplusplus />,
        defaultCode: `#include <stdio.h>

int main() {
  printf("Hello, Universe!\\n");
  return 0;
}`,
      },
      {
        id: "go",
        name: "go",
        nameDisplay: "Go",
        icon: <SiGo />,
        defaultCode: `package main

import "fmt"

func main() {
  fmt.Println("Hello, Universe!")
}`,
      },
      {
        id: "rust",
        name: "rust",
        nameDisplay: "Rust",
        icon: <SiRust />,
        defaultCode: `fn main() {
  println!("Hello, Universe!");
}`,
      },
      {
        id: "php",
        name: "php",
        nameDisplay: "PHP",
        icon: <SiPhp />,
        defaultCode: `<?php
echo "Hello, Universe!";
?>`,
      },
    ],
    [],
  );

  const currentLang = useMemo(
    () => languages.find((l) => l.id === language) || languages[0],
    [languages, language],
  );

  const editorLanguage =
    language === "cpp" ? "cpp" : language === "c" ? "c" : language;

  const safeCode =
    typeof code === "string" && code.length > 0
      ? code
      : currentLang.defaultCode;

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
    // immediate fallback, so refresh blank varilla
    if (!code || typeof code !== "string") {
      dispatch(setCode(currentLang.defaultCode));
    }
  }, [dispatch, currentLang, code]);

  useEffect(() => {
    dispatch(clearOutput());

    const loadCompilerData = async () => {
      const fallbackCode = currentLang.defaultCode;

      // auth still checking -> keep fallback code, do nothing
      if (authLoading) return;

      // no logged-in user -> just use default
      if (!user?._id) {
        dispatch(setCode(fallbackCode));
        return;
      }

      try {
        const resultAction = await dispatch(
          loadDraftAction({ userId: user._id, language }),
        );

        if (loadDraftAction.fulfilled.match(resultAction)) {
          const loadedCode = resultAction.payload?.code;

          if (typeof loadedCode !== "string" || !loadedCode.trim()) {
            dispatch(setCode(fallbackCode));
          }
        } else {
          dispatch(setCode(fallbackCode));
        }
      } catch {
        dispatch(setCode(fallbackCode));
      }
    };

    loadCompilerData();
  }, [dispatch, authLoading, user?._id, language, currentLang]);

  useEffect(() => {
    if (
      authLoading ||
      !user?._id ||
      loadingDraft ||
      !isInitialized ||
      typeof code !== "string"
    ) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch(saveDraftAction({ userId: user._id, language, code }));
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    dispatch,
    authLoading,
    user?._id,
    language,
    code,
    loadingDraft,
    isInitialized,
  ]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleEditorChange = useCallback(
    (value) => {
      dispatch(setCode(typeof value === "string" ? value : ""));
    },
    [dispatch],
  );

  const runCode = useCallback(() => {
    dispatch(
      runCodeAction({
        language,
        code: safeCode,
        userId: user?._id || null,
      }),
    );
    setActiveTab("console");
  }, [dispatch, language, safeCode, user?._id]);

  const handleAskAIAboutError = () => {
    setActiveTab("ai");
    setAiQuery(
      `I got this error when running my ${currentLang.name} code. Can you explain what went wrong and give me a hint to fix it?\n\nError:\n${error || ""}`,
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-2 font-sans bg-[var(--color-background)] text-[var(--text-color-primary)] transition-colors duration-300">
      <div className="w-full max-w-[1450px] h-[95vh] flex flex-col bg-[var(--color-background-soft)] rounded-[2rem] overflow-hidden border border-[var(--border-color-primary)] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] transition-all duration-500">
        <div className="h-16 px-6 flex items-center justify-between bg-[var(--color-background-elevated)]/80 backdrop-blur-md border-b border-[var(--border-color-primary)] shrink-0 z-10">
          <div className="flex items-center gap-6">
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

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-[var(--color-background-soft)] text-[var(--text-color-muted)] hover:text-[var(--color-primary)] border border-[var(--border-color-primary)] transition-all hover:scale-105 active:scale-95"
              title="Toggle Theme"
            >
              {isDarkMode ? <HiSun size={16} /> : <HiMoon size={16} />}
            </button>

            <div className="h-6 w-px bg-[var(--border-color-primary)] hidden sm:block"></div>

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

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[var(--color-background)]">
          <div className="flex-[3] relative border-b lg:border-b-0 lg:border-r border-[var(--border-color-primary)] pt-2">
            <Editor
              height="100%"
              theme={editorTheme}
              language={editorLanguage}
              value={safeCode}
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

          <div className="flex-[2] min-w-[380px] flex flex-col bg-[var(--color-background-soft)]">
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
                />
                AI Assistant
              </button>
            </div>

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
                    <div className="flex flex-col items-start gap-5">
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
                    <pre className="whitespace-pre-wrap text-[var(--color-success)] font-medium">
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
                  code={safeCode}
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
