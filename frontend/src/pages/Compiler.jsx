import React, { useState, useEffect, useMemo, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useDispatch, useSelector } from "react-redux";
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
  HiCode,
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

const Compiler = () => {
  const dispatch = useDispatch();

  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const {
    code,
    output: reduxOutput,
    compiling,
    loadingDraft,
    isInitialized,
    error,
  } = useSelector((state) => state.compiler);

  const languages = useMemo(
    () => [
      {
        id: "javascript",
        name: "JavaScript",
        icon: <SiJavascript />,
        ext: "js",
        defaultCode: `// OrbitonCX JS
console.log("Hello, Universe!");`,
      },
      {
        id: "python",
        name: "Python",
        icon: <SiPython />,
        ext: "py",
        defaultCode: `# OrbitonCX Python
print("Hello, Universe!")`,
      },
      {
        id: "java",
        name: "Java",
        icon: <SiOpenjdk />,
        ext: "java",
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
        ext: "cpp",
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
        icon: <HiCode />,
        ext: "c",
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
        ext: "go",
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
        ext: "rs",
        defaultCode: `fn main() {
    println!("Hello, Universe!");
}`,
      },
      {
        id: "php",
        name: "php",
        nameDisplay: "PHP",
        icon: <SiPhp />,
        ext: "php",
        defaultCode: `<?php
echo "Hello, Universe!";
?>`,
      },
    ],
    []
  );

  const [language, setLanguage] = useState("javascript");
  const [editorTheme, setEditorTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "vs-dark" : "light"
  );

  const currentLang = useMemo(
    () => languages.find((l) => l.id === language),
    [languages, language]
  );

  const editorLanguage =
    language === "cpp" ? "cpp" : language === "c" ? "c" : language;

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
    if (authLoading) return;

    dispatch(clearOutput());

    if (user?._id) {
      dispatch(loadDraftAction({ userId: user._id, language }));
    } else {
      dispatch(setCode(currentLang?.defaultCode || ""));
    }
  }, [dispatch, authLoading, user?._id, language, currentLang]);

  useEffect(() => {
    if (!user?._id) return;
    if (loadingDraft) return;
    if (!isInitialized) return;
    if (typeof code !== "string") return;

    const timer = setTimeout(() => {
      dispatch(
        saveDraftAction({
          userId: user._id,
          language,
          code,
        })
      );
    }, 1500);

    return () => clearTimeout(timer);
  }, [dispatch, user?._id, language, code, loadingDraft, isInitialized]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleEditorChange = useCallback(
    (value) => {
      dispatch(setCode(value || ""));
    },
    [dispatch]
  );

  const runCode = useCallback(() => {
    dispatch(
      runCodeAction({
        language,
        code,
        userId: user?._id || null,
      })
    );
  }, [dispatch, language, code, user?._id]);

  if (authLoading || (user?._id && loadingDraft && !isInitialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black tracking-[0.3em] text-muted uppercase animate-pulse">
            Syncing_OrbitonCX...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24 font-sans bg-background transition-colors duration-300">
      <div className="w-full max-w-350 h-[85vh] flex flex-col bg-background-soft rounded-3xl overflow-hidden border border-primary shadow-xl">
        <div className="h-16 px-6 flex items-center justify-between bg-background-elevated border-b border-primary shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary">
              <HiCode size={24} />
              <span className="font-black text-sm tracking-tighter text-primary hidden sm:block uppercase">
                Orbiton<span className="text-primary-dark">CX</span>
              </span>
            </div>

            <div className="relative flex items-center bg-background-soft rounded-xl border border-primary hover:border-primary-dark transition-all overflow-hidden">
              <div className="flex items-center pl-4 pointer-events-none text-primary text-lg">
                {currentLang?.icon}
              </div>

              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-transparent pl-3 pr-10 py-2 text-xs font-bold text-secondary outline-none cursor-pointer appearance-none capitalize tracking-wide z-10"
              >
                {languages.map((lang) => (
                  <option
                    key={lang.id}
                    value={lang.id}
                    className="bg-background-soft text-primary"
                  >
                    {lang.nameDisplay || lang.name}
                  </option>
                ))}
              </select>

              <div className="absolute right-3 pointer-events-none">
                <HiChevronDown className="text-muted" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={runCode}
              disabled={compiling || loadingDraft}
              className="bg-primary text-white px-6 py-2 rounded-xl font-black text-[10px] tracking-[0.2em] hover:opacity-90 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {compiling ? (
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <HiPlay size={16} />
              )}
              {compiling ? "RUNNING" : "EXECUTE"}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-3 relative bg-background-soft border-b lg:border-b-0 lg:border-r border-primary">
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
                padding: { top: 20 },
                lineNumbers: "on",
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          </div>

          <div className="flex-1 min-w-87.5 bg-background flex flex-col">
            <div className="px-6 py-3 border-b border-primary flex items-center justify-between bg-background-elevated">
              <div className="flex items-center gap-2">
                <HiTerminal size={14} className="text-muted" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  Console Output
                </span>
              </div>

              <button
                onClick={() => dispatch(clearOutput())}
                className="text-muted hover:text-red-500 transition-colors"
              >
                <HiTrash size={16} />
              </button>
            </div>

            <div className="flex-1 p-6 font-mono text-xs md:text-sm overflow-y-auto text-secondary leading-relaxed">
              {error ? (
                <pre className="text-red-500 whitespace-pre-wrap font-bold">
                  {error}
                </pre>
              ) : reduxOutput ? (
                <pre className="whitespace-pre-wrap">{reduxOutput}</pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-muted opacity-50">
                    {compiling ? "Executing..." : "Idle_System"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compiler;