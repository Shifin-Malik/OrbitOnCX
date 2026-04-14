import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import { FaChevronLeft } from "react-icons/fa";

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

const LANGUAGE_LABELS = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  go: "Go",
  rust: "Rust",
  php: "PHP",
};

const normalizeStarter = (starterCode, lang) => {
  if (!starterCode) return "";
  if (typeof starterCode === "string") return starterCode;
  return starterCode?.[lang] || "";
};

const normalizeLanguage = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const normalizeLineEndings = (value) =>
  String(value || "").replace(/\r\n/g, "\n");

const toPrettyStatus = (value) => {
  const source = String(value || "").trim();
  if (!source) return "Idle";
  if (source.includes(" ")) return source;
  return source
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
const MIN_EDITOR_PX = 0;
const MIN_OUTPUT_PX = 44;

const ProblemSolvePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLgUp = useMediaQuery("(min-width: 1024px)");

  const { activeProblem, loadingProblem, problemError } = useSelector(
    (state) => state.problems,
  );
  const {
    running,
    submitting,
    output,
    submitResult,
    error,
    draft,
    draftLoading,
    draftSaving,
    draftError,
    draftLanguage,
  } = useSelector((state) => state.submissions);

  console.log(activeProblem);

  const [leftTab, setLeftTab] = useState("description");
  const [bottomTab, setBottomTab] = useState("testcase");
  const [resultMode, setResultMode] = useState("run");

  const [language, setLanguage] = useState("javascript");
  const [codeByLanguage, setCodeByLanguage] = useState({});
  const [draftLoadedByLanguage, setDraftLoadedByLanguage] = useState({});
  const [lastSavedCodeByLanguage, setLastSavedCodeByLanguage] = useState({});
  const [dirtyCodeByLanguage, setDirtyCodeByLanguage] = useState({});

  const [selectedTestcaseIndex, setSelectedTestcaseIndex] = useState(0);
  const [stdinByKey, setStdinByKey] = useState({});

  const [editorTheme, setEditorTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "vs-dark" : "light",
  );

  const layoutRootRef = useRef(null);
  const rightBodyRef = useRef(null);
  const editorRef = useRef(null);

  const [leftWidthPx, setLeftWidthPx] = useState(null);
  const [editorHeightPx, setEditorHeightPx] = useState(null);

  const languageOptions = useMemo(() => {
    const supported = Array.isArray(activeProblem?.supportedLanguages)
      ? activeProblem.supportedLanguages
      : [];
    const normalized = (
      supported.length ? supported : ["javascript", "python", "java", "cpp"]
    )
      .map((item) => normalizeLanguage(item))
      .filter(Boolean);

    const unique = [...new Set(normalized)];
    return unique.map((id) => ({
      id,
      label: LANGUAGE_LABELS[id] || id.toUpperCase(),
    }));
  }, [activeProblem?.supportedLanguages]);

  const visibleTestCases = useMemo(() => {
    if (!Array.isArray(activeProblem?.visibleTestCases)) return [];
    return activeProblem.visibleTestCases;
  }, [activeProblem?.visibleTestCases]);

  const selectedVisibleCase =
    Number.isInteger(selectedTestcaseIndex) && selectedTestcaseIndex >= 0
      ? visibleTestCases[selectedTestcaseIndex] || null
      : null;

  const stdinKey = Number.isInteger(selectedTestcaseIndex)
    ? `case-${selectedTestcaseIndex}`
    : "custom";

  const activeInput =
    stdinByKey[stdinKey] ??
    (selectedVisibleCase ? String(selectedVisibleCase.input || "") : "");

  const currentCode = codeByLanguage[language] ?? "";
  const isDraftLoadedForLanguage = Boolean(draftLoadedByLanguage[language]);
  const lastSavedCode =
    lastSavedCodeByLanguage[language] !== undefined
      ? lastSavedCodeByLanguage[language]
      : null;

  const runOutputForPanel = resultMode === "run" ? output : null;
  const submitOutputForPanel = resultMode === "submit" ? submitResult : null;

  const meta = useMemo(() => {
    if (!activeProblem) return null;
    return {
      title: activeProblem.title,
      difficulty: activeProblem.difficulty,
      constraints: activeProblem.constraints || [],
      examples: activeProblem.examples || [],
      hints: activeProblem.hints || [],
    };
  }, [activeProblem]);

  const outputStatusLabel = useMemo(() => {
    if (resultMode === "submit") {
      return toPrettyStatus(
        submitOutputForPanel?.submission?.verdict ||
          submitOutputForPanel?.status ||
          (submitOutputForPanel?.isAccepted ? "Accepted" : ""),
      );
    }

    return toPrettyStatus(
      runOutputForPanel?.run?.verdict ||
        runOutputForPanel?.result?.status?.description ||
        runOutputForPanel?.status,
    );
  }, [resultMode, runOutputForPanel, submitOutputForPanel]);

  const saveStatusLabel = useMemo(() => {
    if (!language) return "";
    if (!isDraftLoadedForLanguage && draftLoading) return "Loading draft...";
    if (!isDraftLoadedForLanguage) return "Syncing...";
    if (draftSaving) return "Saving...";
    if (draftError && draftLanguage === language) return "Save unavailable";
    if (lastSavedCode === null) return "Unsaved changes";
    return currentCode === lastSavedCode ? "Saved" : "Unsaved changes";
  }, [
    language,
    isDraftLoadedForLanguage,
    draftLoading,
    draftSaving,
    draftError,
    draftLanguage,
    currentCode,
    lastSavedCode,
  ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.leftWidthPx === "number")
        setLeftWidthPx(parsed.leftWidthPx);
      if (typeof parsed?.editorHeightPx === "number")
        setEditorHeightPx(parsed.editorHeightPx);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!isLgUp) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          LAYOUT_STORAGE_KEY,
          JSON.stringify({ leftWidthPx, editorHeightPx }),
        );
      } catch {
        // ignore storage errors
      }
    }, 250);

    return () => clearTimeout(timer);
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
      if (typeof prev !== "number") return fallback;
      return Math.min(maxLeft, Math.max(MIN_LEFT_PX, prev));
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
      if (typeof prev !== "number") return fallback;
      return Math.min(maxEditor, Math.max(MIN_EDITOR_PX, prev));
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
    setLeftTab("description");
    setBottomTab("testcase");
    setResultMode("run");
    setLanguage("javascript");
    setCodeByLanguage({});
    setDraftLoadedByLanguage({});
    setLastSavedCodeByLanguage({});
    setDirtyCodeByLanguage({});
    setSelectedTestcaseIndex(0);
    setStdinByKey({});

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
    if (!languageOptions.length) return;
    setLanguage((prev) =>
      languageOptions.some((item) => item.id === prev)
        ? prev
        : languageOptions[0].id,
    );
  }, [languageOptions]);

  useEffect(() => {
    if (!activeProblem || !language) return;
    setCodeByLanguage((prev) => {
      if (prev[language] !== undefined) return prev;
      return {
        ...prev,
        [language]: normalizeStarter(activeProblem.starterCode, language),
      };
    });
  }, [activeProblem, language]);

  useEffect(() => {
    if (!activeProblem) return;

    if (visibleTestCases.length > 0) {
      setSelectedTestcaseIndex((prev) =>
        Number.isInteger(prev) && prev >= 0 && prev < visibleTestCases.length
          ? prev
          : 0,
      );

      setStdinByKey((prev) => {
        const next = { ...prev };
        visibleTestCases.forEach((testCase, index) => {
          const key = `case-${index}`;
          if (next[key] === undefined)
            next[key] = String(testCase?.input || "");
        });
        return next;
      });
      return;
    }

    setSelectedTestcaseIndex(null);
    setStdinByKey((prev) =>
      prev.custom === undefined ? { ...prev, custom: "" } : prev,
    );
  }, [activeProblem, visibleTestCases]);

  useEffect(() => {
    if (!slug || !activeProblem || !language || isDraftLoadedForLanguage)
      return;
    dispatch(fetchProblemDraft({ slug, language }));
  }, [dispatch, slug, activeProblem, language, isDraftLoadedForLanguage]);

  useEffect(() => {
    if (!language || !activeProblem) return;
    if (!draftLanguage || draftLanguage !== language) return;
    if (draftLoading || isDraftLoadedForLanguage) return;

    const fallback = normalizeStarter(activeProblem.starterCode, language);

    if (draftError) {
      setCodeByLanguage((prev) => {
        if (prev[language] !== undefined) return prev;
        return { ...prev, [language]: fallback || "" };
      });
      setLastSavedCodeByLanguage((prev) => ({
        ...prev,
        [language]: codeByLanguage[language] ?? fallback ?? "",
      }));
      setDirtyCodeByLanguage((prev) => ({ ...prev, [language]: false }));
      setDraftLoadedByLanguage((prev) => ({ ...prev, [language]: true }));
      return;
    }

    const incomingCode = draft?.hasDraft
      ? String(draft?.code || "")
      : String(draft?.starterCode || fallback || "");

    setCodeByLanguage((prev) => {
      if (dirtyCodeByLanguage[language]) return prev;
      return { ...prev, [language]: incomingCode };
    });
    setLastSavedCodeByLanguage((prev) => ({
      ...prev,
      [language]: incomingCode,
    }));
    setDirtyCodeByLanguage((prev) => ({ ...prev, [language]: false }));
    setDraftLoadedByLanguage((prev) => ({ ...prev, [language]: true }));
  }, [
    language,
    activeProblem,
    draft,
    draftLoading,
    draftError,
    draftLanguage,
    isDraftLoadedForLanguage,
    codeByLanguage,
    dirtyCodeByLanguage,
  ]);

  useEffect(() => {
    if (!slug || !language || !isDraftLoadedForLanguage) return;
    if (lastSavedCode !== null && currentCode === lastSavedCode) return;

    const timer = setTimeout(() => {
      const snapshot = currentCode;
      dispatch(saveProblemDraft({ slug, language, code: snapshot }))
        .unwrap()
        .then(() => {
          setLastSavedCodeByLanguage((prev) => ({
            ...prev,
            [language]: snapshot,
          }));
          setDirtyCodeByLanguage((prev) => ({ ...prev, [language]: false }));
        })
        .catch(() => {
          // handled by slice state
        });
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    dispatch,
    slug,
    language,
    currentCode,
    isDraftLoadedForLanguage,
    lastSavedCode,
  ]);

  const handleCodeChange = (value) => {
    const nextCode = value || "";
    setCodeByLanguage((prev) => ({ ...prev, [language]: nextCode }));
    setDirtyCodeByLanguage((prev) => ({
      ...prev,
      [language]: nextCode !== (lastSavedCodeByLanguage[language] ?? ""),
    }));
  };

  const handleResetCode = () => {
    const starter = normalizeStarter(activeProblem?.starterCode, language);
    setCodeByLanguage((prev) => ({ ...prev, [language]: starter }));
    setDirtyCodeByLanguage((prev) => ({
      ...prev,
      [language]: starter !== (lastSavedCodeByLanguage[language] ?? ""),
    }));
  };

  const handleRun = async () => {
    if (!currentCode.trim()) {
      toast.error("Code is required");
      return;
    }

    setResultMode("run");
    setBottomTab("output");

    const payload = { slug, language, code: currentCode };
    const selectedInput = String(selectedVisibleCase?.input || "");
    const currentInputValue = String(activeInput || "");

    const shouldUseVisibleCase =
      selectedVisibleCase &&
      Number.isInteger(selectedTestcaseIndex) &&
      normalizeLineEndings(currentInputValue) ===
        normalizeLineEndings(selectedInput);

    if (shouldUseVisibleCase) payload.testcaseIndex = selectedTestcaseIndex;
    else payload.stdin = currentInputValue;

    try {
      const res = await dispatch(runProblem(payload)).unwrap();
      const verdict =
        res?.run?.verdict || res?.result?.status?.description || "Run complete";
      if (String(verdict).toLowerCase().includes("accepted"))
        toast.success(verdict);
      else toast.error(verdict);
    } catch (err) {
      toast.error(err || "Run failed");
    }
  };

  const handleSubmit = async () => {
    if (!currentCode.trim()) {
      toast.error("Code is required");
      return;
    }

    setResultMode("submit");
    setBottomTab("output");

    try {
      const res = await dispatch(
        submitProblem({ slug, language, code: currentCode }),
      ).unwrap();

      const verdict =
        res?.submission?.verdict ||
        res?.status ||
        (res?.isAccepted ? "Accepted" : "Wrong Answer");

      if (String(verdict).toLowerCase().includes("accepted"))
        toast.success(verdict);
      else toast.error(verdict);
    } catch (err) {
      toast.error(err || "Submit failed");
    }
  };

  const startVerticalResize = (event) => {
    if (!isLgUp) return;
    const root = layoutRootRef.current;
    if (!root) return;

    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const startX = event.clientX;
    const startLeft =
      typeof leftWidthPx === "number" ? leftWidthPx : MIN_LEFT_PX;

    const onMove = (moveEvent) => {
      const rootWidth = root.clientWidth || 0;
      const maxLeft = Math.max(
        MIN_LEFT_PX,
        rootWidth - MIN_RIGHT_PX - VERTICAL_HANDLE_PX,
      );
      const next = startLeft + (moveEvent.clientX - startX);
      setLeftWidthPx(Math.min(maxLeft, Math.max(MIN_LEFT_PX, next)));
    };

    const onUp = (upEvent) => {
      handle.releasePointerCapture(upEvent.pointerId);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const startHorizontalResize = (event) => {
    if (!isLgUp) return;
    const body = rightBodyRef.current;
    if (!body) return;

    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const startY = event.clientY;
    const startEditor =
      typeof editorHeightPx === "number" ? editorHeightPx : MIN_EDITOR_PX;

    const onMove = (moveEvent) => {
      const bodyHeight = body.clientHeight || 0;
      const maxEditor = Math.max(
        MIN_EDITOR_PX,
        bodyHeight - MIN_OUTPUT_PX - HORIZONTAL_HANDLE_PX,
      );
      const next = startEditor + (moveEvent.clientY - startY);
      setEditorHeightPx(Math.min(maxEditor, Math.max(MIN_EDITOR_PX, next)));
    };

    const onUp = (upEvent) => {
      handle.releasePointerCapture(upEvent.pointerId);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  if (loadingProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-[12px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
          Loading problem...
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
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--text-color-primary)] pt-2">
      <div className="h-[calc(95vh)] max-w-[1400px] mx-auto px-3 md:px-2">
        <div
          ref={layoutRootRef}
          className="h-full grid grid-cols-1 lg:grid-cols-[auto_12px_1fr] gap-3 lg:gap-0"
          style={
            isLgUp && typeof leftWidthPx === "number"
              ? {
                  gridTemplateColumns: `${leftWidthPx}px ${VERTICAL_HANDLE_PX}px 1fr`,
                }
              : undefined
          }
        >
          <div className="h-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-3xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => navigate("/leetcode")}
                  className="p-2 rounded-xl hover:bg-[var(--color-background-soft)] transition"
                  title="Back"
                >
                  <FaChevronLeft />
                </button>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                    {meta?.difficulty}
                  </div>
                  <div className="text-lg font-black tracking-tight truncate">
                    {meta?.title}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 overflow-x-auto">
                {["description", "discussion", "submissions"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setLeftTab(item)}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${
                      leftTab === item
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[var(--text-color-secondary)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {leftTab === "description" ? (
                <div className="space-y-6">
                  <p className="text-[var(--text-color-secondary)] whitespace-pre-wrap">
                    {activeProblem.description}
                  </p>

                  {meta?.examples?.length ? (
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                        Examples
                      </div>
                      {meta.examples.map((example, index) => (
                        <div
                          key={index}
                          className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-2xl p-4"
                        >
                          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                            Example {index + 1}
                          </div>
                          <pre className="mt-2 text-xs font-mono whitespace-pre-wrap">{`Input:\n${example.input || ""}\nOutput:\n${example.output || ""}`}</pre>
                          {example.explanation ? (
                            <div className="mt-2 text-[12px] text-[var(--text-color-secondary)] whitespace-pre-wrap">
                              {example.explanation}
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
                        {meta.constraints.map((constraint, index) => (
                          <li key={index}>{constraint}</li>
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
                        {meta.hints.map((hint, index) => (
                          <li key={index}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : leftTab === "discussion" ? (
                <DiscussionPanel problemId={activeProblem._id} />
              ) : (
                <SubmissionsPanel slug={slug} />
              )}
            </div>
          </div>

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

          <div className="h-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-3xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                  Language
                </div>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="px-3 py-2 rounded-2xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[12px] font-bold"
                >
                  {languageOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-[10px] font-bold text-[var(--text-color-muted)] px-2">
                  {saveStatusLabel}
                </div>
                <button
                  onClick={handleResetCode}
                  disabled={running || submitting}
                  className="px-4 py-2 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  onClick={handleRun}
                  disabled={running || submitting}
                  className="px-5 py-3 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  {running ? "Running..." : "Run"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={running || submitting}
                  className="px-5 py-3 rounded-2xl bg-[var(--color-primary)] text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
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
                  : { gridTemplateRows: "1fr 320px" }
              }
            >
              <div className="bg-[#050505] overflow-hidden">
                <Editor
                  height="100%"
                  theme={editorTheme}
                  language={language === "cpp" ? "cpp" : language}
                  value={currentCode}
                  onChange={handleCodeChange}
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
                <div className="px-5 py-3 border-b border-[var(--border-color-primary)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {[
                      { id: "testcase", label: "Testcase" },
                      { id: "output", label: "Output" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setBottomTab(item.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                          bottomTab === item.id
                            ? "bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[var(--text-color-primary)]"
                            : "text-[var(--text-color-muted)] hover:bg-[var(--color-background-soft)]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-color-muted)]">
                    {running
                      ? "running"
                      : submitting
                        ? "submitting"
                        : outputStatusLabel.toLowerCase()}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                  {bottomTab === "testcase" ? (
                    <div className="space-y-4">
                      {visibleTestCases.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {visibleTestCases.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedTestcaseIndex(index)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                                selectedTestcaseIndex === index
                                  ? "bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[var(--text-color-primary)]"
                                  : "text-[var(--text-color-muted)] hover:bg-[var(--color-background-soft)]"
                              }`}
                            >
                              Case {index + 1}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-color-muted)]">
                          No visible testcase configured. You can still run with
                          custom input.
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                          Input
                        </div>
                        <textarea
                          value={activeInput}
                          onChange={(event) => {
                            const next = event.target.value;
                            setStdinByKey((prev) => ({
                              ...prev,
                              [stdinKey]: next,
                            }));
                          }}
                          className="w-full min-h-[120px] rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] px-3 py-2 text-[12px] font-mono text-[var(--text-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                          placeholder="Enter custom stdin here"
                        />
                      </div>

                      {selectedVisibleCase ? (
                        <div className="space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                            Expected Output
                          </div>
                          <pre className="p-3 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] text-[11px] font-mono text-[var(--text-color-primary)] whitespace-pre-wrap break-words">
                            {String(
                              selectedVisibleCase.output ||
                                selectedVisibleCase.expectedOutput ||
                                "",
                            ) || "No expected output"}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <OutputPanel
                      error={error}
                      runOutput={runOutputForPanel}
                      submitOutput={submitOutputForPanel}
                      running={running}
                      submitting={submitting}
                    />
                  )}
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
