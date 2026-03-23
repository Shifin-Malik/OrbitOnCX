import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useDispatch, useSelector } from "react-redux";
import {
  runCodeAction,
  clearOutput,
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
    output: reduxOutput,
    loading: reduxLoading,
    error,
  } = useSelector((state) => state.compiler);

  const languages = [
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
  ];

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(languages[0].defaultCode);
  const [editorTheme, setEditorTheme] = useState(() =>
    localStorage.getItem("theme") === "dark" ? "vs-dark" : "light",
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

  const handleLanguageChange = (e) => {
    const newLangId = e.target.value;
    setLanguage(newLangId);
    const langObj = languages.find((l) => l.id === newLangId);
    if (langObj) setCode(langObj.defaultCode);
    dispatch(clearOutput());
  };

  const runCode = () => {
    dispatch(runCodeAction({ language, code, userId: user ? user._id : null }));
  };

  const currentLang = languages.find((l) => l.id === language);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24 font-sans bg-[var(--color-background)] transition-colors duration-300">
      <div className="w-full max-w-[1400px] h-[85vh] flex flex-col bg-[var(--color-background-soft)] rounded-3xl overflow-hidden border border-[var(--border-color-primary)] shadow-xl">
        {/* --- TOP NAVBAR --- */}
        <div className="h-16 px-6 flex items-center justify-between bg-[var(--color-background-elevated)] border-b border-[var(--border-color-primary)] shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[var(--color-primary)]">
              <HiCode size={24} />
              <span className="font-black text-sm tracking-tighter text-[var(--text-color-primary)] hidden sm:block uppercase">
                Orbiton<span className="text-[var(--color-primary)]">CX</span>
              </span>
            </div>

            {/* Language Selector - UI FIX HERE */}
            <div className="relative flex items-center bg-[var(--color-background-soft)] rounded-xl border border-[var(--border-color-primary)] hover:border-[var(--color-primary)] transition-all overflow-hidden">
              <div className="flex items-center pl-4 pointer-events-none">
                <span className="text-[var(--color-primary)] text-lg">
                  {currentLang?.icon}
                </span>
              </div>
              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-transparent pl-3 pr-10 py-2 text-xs font-bold text-[var(--text-color-secondary)] outline-none cursor-pointer appearance-none capitalize tracking-wide z-10"
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
              <div className="absolute right-3 pointer-events-none">
                <HiChevronDown className="text-[var(--text-color-muted)]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={runCode}
              disabled={reduxLoading}
              className="bg-[var(--color-primary)] text-white dark:text-[var(--color-secondary)] px-6 py-2 rounded-xl font-black text-[10px] tracking-[0.2em] hover:opacity-90 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {reduxLoading ? (
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <HiPlay size={16} />
              )}
              {reduxLoading ? "RUNNING" : "EXECUTE"}
            </button>
          </div>
        </div>

        {/* Workspace Split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-[3] relative bg-[var(--color-background-soft)] border-b lg:border-b-0 lg:border-r border-[var(--border-color-primary)]">
            <Editor
              height="100%"
              theme={editorTheme}
              language={
                language === "cpp" ? "cpp" : language === "c" ? "c" : language
              }
              value={code}
              onChange={(v) => setCode(v || "")}
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

          <div className="flex-1 min-w-[350px] bg-[var(--color-background)] flex flex-col">
            <div className="px-6 py-3 border-b border-[var(--border-color-primary)] flex items-center justify-between bg-[var(--color-background-elevated)]">
              <div className="flex items-center gap-2">
                <HiTerminal
                  size={14}
                  className="text-[var(--text-color-muted)]"
                />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)]">
                  Console Output
                </span>
              </div>
              <button
                onClick={() => dispatch(clearOutput())}
                className="text-[var(--text-color-muted)] hover:text-red-500 transition-colors"
              >
                <HiTrash size={16} />
              </button>
            </div>

            <div className="flex-1 p-6 font-mono text-xs md:text-sm overflow-y-auto text-[var(--text-color-secondary)] leading-relaxed">
              {error ? (
                <pre className="text-red-500 whitespace-pre-wrap">{error}</pre>
              ) : reduxOutput ? (
                <pre className="whitespace-pre-wrap">{reduxOutput}</pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-[var(--text-color-muted)] opacity-50">
                    {reduxLoading ? "Executing..." : "Idle_System"}
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
