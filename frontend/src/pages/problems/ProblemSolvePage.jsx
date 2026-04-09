import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import { fetchProblemBySlug } from "../../features/problems/problemSlice.js";
import {
  clearRunOutput,
  clearSubmitResult,
  fetchProblemDraft,
  runProblem,
  saveProblemDraft,
  submitProblem,
} from "../../features/submissions/submissionSlice.js";
import DiscussionPanel from "../../components/problems/DiscussionPanel.jsx";
import SubmissionsPanel from "../../components/problems/SubmissionsPanel.jsx";
import OutputPanel from "../../components/problems/OutputPanel.jsx";
import { FaChevronLeft } from "react-icons/fa";

const LANGS = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

const normalizeStarter = (starterCode, lang) => {
  if (!starterCode) return "";
  if (typeof starterCode === "string") return starterCode;
  return starterCode?.[lang] || "";
};

const ProblemSolvePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { activeProblem, loadingProblem, problemError } = useSelector(
    (s) => s.problems,
  );
  const {
    running,
    submitting,
    output,
    submitResult,
    error,
    draft,
    draftLoading,
  } = useSelector((s) => s.submissions);

  const [tab, setTab] = useState("description");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [editorTheme, setEditorTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "vs-dark" : "light",
  );

  useEffect(() => {
    dispatch(fetchProblemBySlug(slug));
    dispatch(clearRunOutput());
    dispatch(clearSubmitResult());
    return () => {
      dispatch(clearRunOutput());
      dispatch(clearSubmitResult());
    };
  }, [dispatch, slug]);

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
    if (!slug) return;
    dispatch(fetchProblemDraft({ slug, language }));
  }, [dispatch, slug, language]);

  useEffect(() => {
    if (draftLoading) return;
    const draftCode = draft?.code || "";
    if (draftCode) setCode(draftCode);
    else {
      const starter =
        draft?.starterCode ||
        normalizeStarter(activeProblem?.starterCode, language);
      setCode(starter || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftLoading, draft?.code, draft?.starterCode, language]);

  useEffect(() => {
    if (!slug) return;
    const t = setTimeout(() => {
      dispatch(saveProblemDraft({ slug, language, code }));
    }, 1200);
    return () => clearTimeout(t);
  }, [dispatch, slug, language, code]);

  const meta = useMemo(() => {
    if (!activeProblem) return null;
    return {
      title: activeProblem.title,
      difficulty: activeProblem.difficulty,
      tags: activeProblem.tags || [],
      constraints: activeProblem.constraints || [],
      examples: activeProblem.examples || [],
      hints: activeProblem.hints || [],
    };
  }, [activeProblem]);

  const run = async () => {
    try {
      const res = await dispatch(runProblem({ slug, language, code })).unwrap();
      if (res?.isAccepted) toast.success("All sample tests passed");
      else toast.error(`Run: ${res?.status}`);
    } catch (e) {
      toast.error(e || "Run failed");
    }
  };

  const submit = async () => {
    try {
      const res = await dispatch(
        submitProblem({ slug, language, code }),
      ).unwrap();
      if (res?.isAccepted) toast.success("Accepted");
      else toast.error(`Submit: ${res?.status}`);
    } catch (e) {
      toast.error(e || "Submit failed");
    }
  };

  if (loadingProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-[12px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
          Loading problem…
        </div>
      </div>
    );
  }

  if (problemError || !activeProblem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] gap-4">
        <div className="text-rose-500 font-black">
          {problemError || "Problem not found"}
        </div>
        <button
          onClick={() => navigate("/leetcode")}
          className="px-5 py-3 rounded-2xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] font-black text-[10px] uppercase tracking-widest"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--text-color-primary)] pt-20">
      <div className="h-[calc(100vh-5rem)] max-w-[1400px] mx-auto px-3 md:px-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left */}
          <div className="h-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-3xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/leetcode")}
                  className="p-2 rounded-xl hover:bg-[var(--color-background-soft)] transition"
                  title="Back"
                >
                  <FaChevronLeft />
                </button>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                    {meta?.difficulty}
                  </div>
                  <div className="text-lg font-black tracking-tight">
                    {meta?.title}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {["description", "discussion", "submissions"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${
                      tab === t
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[var(--text-color-secondary)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {tab === "description" ? (
                <div className="space-y-6">
                  <p className="text-[var(--text-color-secondary)] whitespace-pre-wrap">
                    {activeProblem.description}
                  </p>

                  {meta?.examples?.length ? (
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                        Examples
                      </div>
                      {meta.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-2xl p-4"
                        >
                          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                            Example {idx + 1}
                          </div>
                          <pre className="mt-2 text-xs font-mono whitespace-pre-wrap">
Input:
{ex.input}

Output:
{ex.output}
                          </pre>
                          {ex.explanation ? (
                            <div className="mt-2 text-[12px] text-[var(--text-color-secondary)]">
                              {ex.explanation}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {meta?.constraints?.length ? (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                        Constraints
                      </div>
                      <ul className="list-disc pl-5 text-[12px] text-[var(--text-color-secondary)]">
                        {meta.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {meta?.hints?.length ? (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                        Hints
                      </div>
                      <ul className="list-disc pl-5 text-[12px] text-[var(--text-color-secondary)]">
                        {meta.hints.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : tab === "discussion" ? (
                <DiscussionPanel problemId={activeProblem._id} />
              ) : (
                <SubmissionsPanel slug={slug} />
              )}
            </div>
          </div>

          {/* Right */}
          <div className="h-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-3xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                  Language
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 rounded-2xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[12px] font-bold"
                >
                  {LANGS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={run}
                  disabled={running}
                  className="px-5 py-3 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  {running ? "Running…" : "Run"}
                </button>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="px-5 py-3 rounded-2xl bg-[var(--color-primary)] text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </div>

            <div className="flex-1 grid grid-rows-[1fr_260px]">
              <div className="bg-[#050505]">
                <Editor
                  height="100%"
                  theme={editorTheme}
                  language={language === "cpp" ? "cpp" : language}
                  value={code}
                  onChange={(v) => setCode(v || "")}
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    minimap: { enabled: false },
                    padding: { top: 16 },
                    lineNumbers: "on",
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                  }}
                />
              </div>

              <div className="border-t border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-[var(--border-color-primary)] flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                    Output
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-color-muted)]">
                    {error ? "error" : output?.status || submitResult?.status || "idle"}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                  <OutputPanel
                    error={error}
                    runOutput={output}
                    submitOutput={submitResult}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemSolvePage;

