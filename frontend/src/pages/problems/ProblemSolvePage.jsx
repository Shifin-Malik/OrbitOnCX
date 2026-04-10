import React, { useEffect, useMemo, useRef, useState } from "react";
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

const useMediaQuery = (query) => {
  const getMatches = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const handler = () => setMatches(media.matches);
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
};

const LAYOUT_STORAGE_KEY = "problemSolveLayout:v1";
const VERTICAL_HANDLE_PX = 12;
const HORIZONTAL_HANDLE_PX = 10;
const MIN_LEFT_PX = 320;
const MIN_RIGHT_PX = 460;
const MIN_EDITOR_PX = 220;
const MIN_OUTPUT_PX = 180;

const ProblemSolvePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLgUp = useMediaQuery("(min-width: 1024px)");

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

  const layoutRootRef = useRef(null);
  const rightBodyRef = useRef(null);
  const editorRef = useRef(null);

  const [leftWidthPx, setLeftWidthPx] = useState(null);
  const [editorHeightPx, setEditorHeightPx] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.leftWidthPx === "number") {
        setLeftWidthPx(parsed.leftWidthPx);
      }
      if (typeof parsed?.editorHeightPx === "number") {
        setEditorHeightPx(parsed.editorHeightPx);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!isLgUp) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          LAYOUT_STORAGE_KEY,
          JSON.stringify({ leftWidthPx, editorHeightPx }),
        );
      } catch {
        // ignore storage errors
      }
    }, 250);
    return () => clearTimeout(t);
  }, [isLgUp, leftWidthPx, editorHeightPx]);

  const clampLayoutToViewport = () => {
    if (!isLgUp) return;
    const root = layoutRootRef.current;
    const rightBody = rightBodyRef.current;
    if (!root || !rightBody) return;

    const rootWidth = root.clientWidth || 0;
    const maxLeft = Math.max(
      MIN_LEFT_PX,
      rootWidth - MIN_RIGHT_PX - VERTICAL_HANDLE_PX,
    );

    setLeftWidthPx((prev) => {
      const fallback = Math.min(maxLeft, Math.max(MIN_LEFT_PX, 520));
      const next =
        typeof prev === "number"
          ? Math.min(maxLeft, Math.max(MIN_LEFT_PX, prev))
          : fallback;
      return next;
    });

    const bodyHeight = rightBody.clientHeight || 0;
    const maxEditor = Math.max(
      MIN_EDITOR_PX,
      bodyHeight - MIN_OUTPUT_PX - HORIZONTAL_HANDLE_PX,
    );

    setEditorHeightPx((prev) => {
      const fallback = Math.min(
        maxEditor,
        Math.max(MIN_EDITOR_PX, Math.floor(bodyHeight * 0.62)),
      );
      const next =
        typeof prev === "number"
          ? Math.min(maxEditor, Math.max(MIN_EDITOR_PX, prev))
          : fallback;
      return next;
    });
  };

  useEffect(() => {
    clampLayoutToViewport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLgUp]);

  useEffect(() => {
    if (!isLgUp) return;
    const onResize = () => clampLayoutToViewport();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLgUp]);

  useEffect(() => {
    editorRef.current?.layout?.();
  }, [leftWidthPx, editorHeightPx]);

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

  const startVerticalResize = (e) => {
    if (!isLgUp) return;
    const root = layoutRootRef.current;
    if (!root) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startLeft =
      typeof leftWidthPx === "number" ? leftWidthPx : MIN_LEFT_PX;

    const onMove = (ev) => {
      const rootWidth = root.clientWidth || 0;
      const maxLeft = Math.max(
        MIN_LEFT_PX,
        rootWidth - MIN_RIGHT_PX - VERTICAL_HANDLE_PX,
      );
      const next = startLeft + (ev.clientX - startX);
      setLeftWidthPx(Math.min(maxLeft, Math.max(MIN_LEFT_PX, next)));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const startHorizontalResize = (e) => {
    if (!isLgUp) return;
    const body = rightBodyRef.current;
    if (!body) return;

    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startEditor =
      typeof editorHeightPx === "number" ? editorHeightPx : MIN_EDITOR_PX;

    const onMove = (ev) => {
      const bodyHeight = body.clientHeight || 0;
      const maxEditor = Math.max(
        MIN_EDITOR_PX,
        bodyHeight - MIN_OUTPUT_PX - HORIZONTAL_HANDLE_PX,
      );
      const next = startEditor + (ev.clientY - startY);
      setEditorHeightPx(Math.min(maxEditor, Math.max(MIN_EDITOR_PX, next)));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--text-color-primary)] pt-2">
      <div className="h-[calc(100vh-5rem)] max-w-[1400px] mx-auto px-3 md:px-2">
        <div
          ref={layoutRootRef}
          className="h-full grid grid-cols-1 lg:grid-cols-[auto_12px_1fr]"
          style={
            isLgUp && typeof leftWidthPx === "number"
              ? {
                  gridTemplateColumns: `${leftWidthPx}px ${VERTICAL_HANDLE_PX}px 1fr`,
                }
              : undefined
          }
        >
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

          {/* Vertical Resize Handle (desktop only) */}
          <div className="hidden lg:flex items-stretch justify-center">
            <div
              role="separator"
              aria-orientation="vertical"
              tabIndex={0}
              onPointerDown={startVerticalResize}
              className="w-full cursor-col-resize select-none flex items-center justify-center"
              title="Resize panels"
            >
              <div className="w-[2px] h-[92%] rounded-full bg-[var(--border-color-primary)] opacity-60 hover:opacity-100 transition-opacity" />
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

            <div
              ref={rightBodyRef}
              className="flex-1 grid"
              style={
                isLgUp && typeof editorHeightPx === "number"
                  ? {
                      gridTemplateRows: `${editorHeightPx}px ${HORIZONTAL_HANDLE_PX}px 1fr`,
                    }
                  : { gridTemplateRows: "1fr 260px" }
              }
            >
              <div className="bg-[#050505] overflow-hidden">
                <Editor
                  height="100%"
                  theme={editorTheme}
                  language={language === "cpp" ? "cpp" : language}
                  value={code}
                  onChange={(v) => setCode(v || "")}
                  onMount={(editor) => {
                    editorRef.current = editor;
                    queueMicrotask(() => editor.layout());
                  }}
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

              {/* Horizontal Resize Handle (desktop only) */}
              <div className="hidden lg:flex items-center justify-center bg-[var(--color-background-soft)]">
                <div
                  role="separator"
                  aria-orientation="horizontal"
                  tabIndex={0}
                  onPointerDown={startHorizontalResize}
                  className="w-full h-full cursor-row-resize select-none flex items-center justify-center"
                  title="Resize editor/output"
                >
                  <div className="h-[2px] w-[92%] rounded-full bg-[var(--border-color-primary)] opacity-60 hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="border-t border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-[var(--border-color-primary)] flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                    Output
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-color-muted)]">
                    {error
                      ? "error"
                      : output?.status || submitResult?.status || "idle"}
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
