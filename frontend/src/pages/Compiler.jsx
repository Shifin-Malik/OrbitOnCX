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
  const { user } = useSelector((state) => state.auth);

  const {
    code,
    output: reduxOutput,
    compiling,
    loadingDraft,
    error,
  } = useSelector((state) => state.compiler);

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
        icon: <HiCode />,
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
  const [editorTheme, setEditorTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "vs-dark" : "light",
  );

  // Theme Sync logic
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
    } else {
      const langData = languages.find((l) => l.id === language);
      dispatch(setCode(langData?.defaultCode || ""));
    }
  }, [dispatch, user?._id, language, languages]);

  useEffect(() => {
    if (!user?._id || loadingDraft || !code) return;

    const timer = setTimeout(() => {
      dispatch(
        saveDraftAction({
          userId: user._id,
          language,
          code,
        }),
      );
    }, 2000); // 2s

    return () => clearTimeout(timer);
  }, [dispatch, user?._id, language, code, loadingDraft]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const runCode = () => {
    dispatch(
      runCodeAction({
        language,
        code,
        userId: user ? user._id : null,
      }),
    );
  };

  const currentLang = languages.find((l) => l.id === language);
  const editorLanguage =
    language === "cpp" ? "cpp" : language === "c" ? "c" : language;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24 font-sans bg-background transition-colors duration-300">
      <div className="w-full max-w-350 h-[85vh] flex flex-col bg-background-soft rounded-3xl overflow-hidden border border-primary shadow-xl">
        {/* TOP BAR */}
        <div className="h-16 px-6 flex items-center justify-between bg-background-elevated border-b border-primary shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-(--color-primary)">
              <HiCode size={24} />
              <span className="font-black text-sm tracking-tighter text-primary hidden sm:block uppercase">
                Orbiton<span className="text-(--color-primary)">CX</span>
              </span>
            </div>

            <div className="relative flex items-center bg-background-soft rounded-xl border border-primary hover:border-(--color-primary) transition-all overflow-hidden">
              <div className="flex items-center pl-4 pointer-events-none">
                <span className="text-(--color-primary) text-lg">
                  {currentLang?.icon}
                </span>
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
              className="bg-primary text-white dark:text-(--color-secondary) px-6 py-2 rounded-xl font-black text-[10px] tracking-[0.2em] hover:opacity-90 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
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
          {/* EDITOR */}
          <div className="flex-3 relative bg-background-soft border-b lg:border-b-0 lg:border-r border-primary">
            <Editor
              height="100%"
              theme={editorTheme}
              language={editorLanguage}
              value={code}
              onChange={(v) => dispatch(setCode(v || ""))}
              options={{
                fontSize: 15,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                padding: { top: 20 },
                lineNumbers: "on",
                renderLineHighlight: "all",
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
                <pre className="text-red-500 whitespace-pre-wrap">{error}</pre>
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
