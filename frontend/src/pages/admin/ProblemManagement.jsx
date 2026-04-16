import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaEdit,
  FaTrash,
  FaFileImport,
  FaFilePdf,
  FaDatabase,
  FaCircle,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import ProblemEditor from "../../components/admin/ProblemEditor.jsx";
import {
  clearSelectedAdminProblem,
  clearProblemPdfPreview,
  createAdminProblem,
  createProblemFromJson,
  deleteAdminProblem,
  fetchAdminProblems,
  fetchProblemForEditor,
  importAdminProblemsFromJsonBulk,
  previewAdminProblemPdfImport,
  saveAdminProblemPdfImport,
  updateAdminProblem,
  updateProblemFromJson,
} from "../../features/admin/adminProblemSlice.js";

const extractErrorMessage = (error, fallback) =>
  typeof error === "string"
    ? error
    : error?.message || error?.errors?.[0] || fallback;

const mapProblemForCard = (problem = {}) => ({
  _id: problem._id,
  title: problem.title || "Untitled Problem",
  slug: problem.slug || "",
  difficulty: problem.difficulty || "Easy",
  category:
    Array.isArray(problem.tags) && problem.tags.length > 0
      ? problem.tags[0]
      : "General",
  isActive: Boolean(problem.isActive ?? true),
  points: 5,
});

const ProblemManagement = () => {
  const dispatch = useDispatch();

  const {
    problems: apiProblems = [],
    listLoading,
    listError,
    selectedProblem,
    detailLoading,
    submitting,
    deletingId,
    jsonImportLoading,
    pdfPreview,
    pdfPreviewLoading,
    pdfPreviewError,
    pdfSaveLoading,
    pdfSaveError,
    pdfImportSummary,
  } = useSelector((state) => state.adminProblem);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [selectedPreviewIndexes, setSelectedPreviewIndexes] = useState([]);

  useEffect(() => {
    dispatch(fetchAdminProblems({ page: 1, limit: 100, sort: "newest" }));
  }, [dispatch]);

  const problems = useMemo(
    () => apiProblems.map((problem) => mapProblemForCard(problem)),
    [apiProblems],
  );

  const filteredProblems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return problems;

    return problems.filter((problem) => {
      const title = String(problem.title || "").toLowerCase();
      const slug = String(problem.slug || "").toLowerCase();
      const category = String(problem.category || "").toLowerCase();
      return (
        title.includes(keyword) ||
        slug.includes(keyword) ||
        category.includes(keyword)
      );
    });
  }, [problems, searchTerm]);

  const jsonPreview = useMemo(() => {
    const raw = jsonInput.trim();
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return {
          type: "array",
          count: parsed.length,
          firstTitle: parsed[0]?.title || "",
        };
      }

      if (parsed && typeof parsed === "object") {
        return {
          type: "object",
          title: parsed.title || "",
          difficulty: parsed.difficulty || "",
          slug: parsed.slug || "",
        };
      }

      return {
        type: "invalid",
        message: "JSON must be either a single object or an array of objects.",
      };
    } catch {
      return {
        type: "invalid",
        message: "Invalid JSON syntax.",
      };
    }
  }, [jsonInput]);

  const parsedPdfProblems = useMemo(
    () => (Array.isArray(pdfPreview?.problems) ? pdfPreview.problems : []),
    [pdfPreview],
  );

  const parsedPdfEvaluation = useMemo(() => {
    const entries = Array.isArray(pdfPreview?.evaluation) ? pdfPreview.evaluation : [];
    const map = new Map();
    entries.forEach((entry) => {
      map.set(entry.index, entry);
    });
    return map;
  }, [pdfPreview]);

  const refreshProblems = () =>
    dispatch(fetchAdminProblems({ page: 1, limit: 100, sort: "newest" }));

  const openPdfImportModal = () => {
    setIsPdfModalOpen(true);
    setSelectedPdfFile(null);
    setSelectedPreviewIndexes([]);
    dispatch(clearProblemPdfPreview());
  };

  const closePdfImportModal = () => {
    setIsPdfModalOpen(false);
    setSelectedPdfFile(null);
    setSelectedPreviewIndexes([]);
    dispatch(clearProblemPdfPreview());
  };

  const togglePreviewSelection = (index) => {
    setSelectedPreviewIndexes((prev) => {
      if (prev.includes(index)) {
        return prev.filter((item) => item !== index);
      }
      return [...prev, index];
    });
  };

  const handleParsePdf = async () => {
    if (!selectedPdfFile) {
      toast.error("Please choose a PDF file before parsing.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedPdfFile);

    try {
      const preview = await dispatch(previewAdminProblemPdfImport(formData)).unwrap();
      const parsedCount = Array.isArray(preview?.problems) ? preview.problems.length : 0;
      const previewEvaluation = Array.isArray(preview?.evaluation) ? preview.evaluation : [];
      const selectableIndexes = previewEvaluation
        .filter((entry) => entry?.status === "ready")
        .map((entry) => entry.index)
        .filter((value) => Number.isInteger(value));
      setSelectedPreviewIndexes(selectableIndexes);
      toast.success(`PDF parsed successfully (${parsedCount} problem(s) detected).`);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to parse PDF"));
    }
  };

  const handleSaveParsedPdfProblems = async (mode) => {
    const selected = parsedPdfProblems.filter((_, index) =>
      selectedPreviewIndexes.includes(index),
    );

    if (selected.length === 0) {
      toast.error("Select at least one ready problem before saving.");
      return;
    }

    try {
      const response = await dispatch(
        saveAdminProblemPdfImport({ problems: selected, mode }),
      ).unwrap();

      const summary = response?.data?.summary;
      const inserted = Number(summary?.inserted || 0);
      const duplicates = Number(summary?.duplicates || 0);
      const invalid = Number(summary?.invalid || 0);

      if (inserted > 0) {
        toast.success(
          `Imported ${inserted} problem(s). Duplicates: ${duplicates}, Invalid: ${invalid}.`,
        );
      } else {
        toast.error("No problems were imported.");
      }

      await refreshProblems();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to save parsed problems"));
    }
  };

  const openCreateEditor = () => {
    dispatch(clearSelectedAdminProblem());
    setEditingProblemId(null);
    setEditorMode("create");
    setIsEditorOpen(true);
  };

  const openEditEditor = async (problemId) => {
    dispatch(clearSelectedAdminProblem());
    setEditingProblemId(problemId);
    setEditorMode("edit");
    setIsEditorOpen(true);

    try {
      await dispatch(fetchProblemForEditor(problemId)).unwrap();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Failed to load problem for editing"),
      );
      setIsEditorOpen(false);
      setEditingProblemId(null);
    }
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingProblemId(null);
    dispatch(clearSelectedAdminProblem());
  };

  const handleSaveForm = async (payload) => {
    try {
      if (editorMode === "edit" && editingProblemId) {
        await dispatch(
          updateAdminProblem({ problemId: editingProblemId, payload }),
        ).unwrap();
        toast.success("Problem updated successfully");
      } else {
        await dispatch(createAdminProblem(payload)).unwrap();
        toast.success("Problem created successfully");
      }

      await refreshProblems();
      closeEditor();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to save problem"));
      throw error;
    }
  };

  const handleSaveFromJson = async (payload) => {
    try {
      let savedProblem = null;
      if (editorMode === "edit" && editingProblemId) {
        savedProblem = await dispatch(
          updateProblemFromJson({ problemId: editingProblemId, payload }),
        ).unwrap();
        toast.success("Problem updated successfully from JSON");
      } else {
        savedProblem = await dispatch(createProblemFromJson(payload)).unwrap();
        toast.success("Problem created successfully from JSON");
      }

      await refreshProblems();
      return savedProblem;
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to save JSON");
      toast.error(message);
      throw error;
    }
  };

  const handleDelete = async (problemId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this problem?",
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteAdminProblem(problemId)).unwrap();
      toast.success("Problem deleted successfully");
      await refreshProblems();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to delete problem"));
    }
  };

  const handleImportJson = async () => {
    const raw = jsonInput.trim();
    if (!raw) {
      toast.error("Please paste JSON before importing.");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      await dispatch(importAdminProblemsFromJsonBulk(parsed)).unwrap();

      toast.success("Problems imported successfully!");
      setJsonInput("");
      setIsJsonModalOpen(false);
      await refreshProblems();
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to import JSON");
      toast.error(message);
    }
  };

  const getPdfStatusClass = (status) => {
    if (status === "ready") {
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
    if (status === "duplicate") {
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
    return "bg-rose-500/10 text-rose-500 border-rose-500/20";
  };

  if (isEditorOpen) {
    const isEditLoading =
      editorMode === "edit" &&
      (detailLoading || selectedProblem?._id !== editingProblemId);

    return (
      <ProblemEditor
        editData={editorMode === "edit" ? selectedProblem : null}
        isEditLoading={isEditLoading}
        isSaving={submitting}
        isJsonSaving={jsonImportLoading}
        onBack={closeEditor}
        onSave={handleSaveForm}
        onSaveFromJson={handleSaveFromJson}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-4 space-y-4 animate-in fade-in duration-500">
      {isJsonModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[var(--color-background-soft)] w-full max-w-3xl rounded-[2rem] border border-[var(--border-color-primary)] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color-primary)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center">
                  <FaFileImport size={14} />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-wide text-sm">
                    Import Problem JSON
                  </h3>
                  <p className="text-[10px] text-[var(--text-color-muted)] font-bold uppercase tracking-widest">
                    Single object or array supported
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="p-2 text-[var(--text-color-muted)] hover:text-rose-500 transition-colors"
                aria-label="Close JSON import modal"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <textarea
                className="w-full h-64 bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-2xl p-4 text-xs font-mono text-[var(--text-color-primary)] outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder='Paste JSON here. Example: { "title": "Two Sum", "difficulty": "Easy", ... }'
                value={jsonInput}
                onChange={(event) => setJsonInput(event.target.value)}
              />

              {jsonPreview ? (
                <div className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-3">
                  {jsonPreview.type === "invalid" ? (
                    <p className="text-[11px] font-bold text-rose-500">
                      {jsonPreview.message}
                    </p>
                  ) : jsonPreview.type === "object" ? (
                    <div className="text-[11px] text-[var(--text-color-secondary)] space-y-1">
                      <p>
                        <span className="font-black text-[var(--text-color-primary)]">
                          Title:
                        </span>{" "}
                        {jsonPreview.title || "-"}
                      </p>
                      <p>
                        <span className="font-black text-[var(--text-color-primary)]">
                          Difficulty:
                        </span>{" "}
                        {jsonPreview.difficulty || "-"}
                      </p>
                      <p>
                        <span className="font-black text-[var(--text-color-primary)]">
                          Slug:
                        </span>{" "}
                        {jsonPreview.slug || "(auto-generated from title)"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--text-color-secondary)]">
                      Array detected with{" "}
                      <span className="font-black text-[var(--text-color-primary)]">
                        {jsonPreview.count}
                      </span>{" "}
                      item(s).
                    </p>
                  )}
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  onClick={() => setIsJsonModalOpen(false)}
                  className="flex-1 py-3 border border-[var(--border-color-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-background-elevated)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportJson}
                  disabled={jsonImportLoading}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-success-glow)] hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {jsonImportLoading ? "Importing..." : "Import JSON"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isPdfModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[var(--color-background-soft)] w-full max-w-5xl rounded-[2rem] border border-[var(--border-color-primary)] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-[var(--border-color-primary)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center">
                  <FaFilePdf size={14} />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-wide text-sm">
                    Import Problems From PDF
                  </h3>
                  <p className="text-[10px] text-[var(--text-color-muted)] font-bold uppercase tracking-widest">
                    Parse, review, then publish or save as draft
                  </p>
                </div>
              </div>
              <button
                onClick={closePdfImportModal}
                className="p-2 text-[var(--text-color-muted)] hover:text-rose-500 transition-colors"
                aria-label="Close PDF import modal"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                    Upload PDF
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setSelectedPdfFile(file);
                    }}
                    className="w-full text-[11px] font-medium file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-[var(--border-color-primary)] file:bg-[var(--color-background-soft)] file:font-black file:text-[10px] file:uppercase file:tracking-widest file:cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleParsePdf}
                  disabled={pdfPreviewLoading || pdfSaveLoading}
                  className="px-5 py-3 bg-[var(--color-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-success-glow)] hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {pdfPreviewLoading ? "Parsing..." : "Parse PDF"}
                </button>
              </div>

              {pdfPreviewError ? (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-rose-500 text-sm font-bold">
                  {extractErrorMessage(pdfPreviewError, "Failed to parse PDF")}
                </div>
              ) : null}

              {pdfSaveError ? (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-rose-500 text-sm font-bold">
                  {extractErrorMessage(pdfSaveError, "Failed to save PDF import")}
                </div>
              ) : null}

              {pdfPreview?.summary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Parsed", value: pdfPreview.summary.totalParsed || 0 },
                    { label: "Ready", value: pdfPreview.summary.valid || 0 },
                    { label: "Duplicates", value: pdfPreview.summary.duplicates || 0 },
                    { label: "Invalid", value: pdfPreview.summary.invalid || 0 },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-3"
                    >
                      <p className="text-[9px] font-black uppercase text-[var(--text-color-muted)]">
                        {item.label}
                      </p>
                      <p className="text-lg font-black text-[var(--text-color-primary)]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {parsedPdfProblems.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                      Select problems to import
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedPreviewIndexes(
                            parsedPdfProblems
                              .map((_, index) => {
                                const item = parsedPdfEvaluation.get(index);
                                return item?.status === "ready" ? index : null;
                              })
                              .filter((value) => value !== null),
                          )
                        }
                        className="px-3 py-2 border border-[var(--border-color-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-background-elevated)] transition-all"
                      >
                        Select All Ready
                      </button>
                      <button
                        onClick={() => setSelectedPreviewIndexes([])}
                        className="px-3 py-2 border border-[var(--border-color-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-background-elevated)] transition-all"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
                    {parsedPdfProblems.map((problem, index) => {
                      const evaluation = parsedPdfEvaluation.get(index);
                      const status = evaluation?.status || "ready";
                      const isSelectable = status === "ready";
                      const isSelected = selectedPreviewIndexes.includes(index);

                      return (
                        <div
                          key={`${problem.title || "problem"}-${index}`}
                          className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-xs font-black text-[var(--text-color-primary)]">
                                {problem.title || `Problem ${index + 1}`}
                              </p>
                              <p className="text-[10px] font-bold text-[var(--text-color-muted)] uppercase tracking-wider">
                                Difficulty: {problem.difficulty || "Easy"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${getPdfStatusClass(status)}`}
                              >
                                {status}
                              </span>
                              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={!isSelectable || pdfSaveLoading}
                                  onChange={() => togglePreviewSelection(index)}
                                  className="accent-[var(--color-primary)]"
                                />
                                Select
                              </label>
                            </div>
                          </div>

                          {Array.isArray(evaluation?.errors) && evaluation.errors.length > 0 ? (
                            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-[11px] font-medium text-rose-500">
                              {evaluation.errors.join(" ")}
                            </div>
                          ) : null}

                          <pre className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-xl p-3 text-[10px] font-mono text-[var(--text-color-primary)] overflow-x-auto">
                            {JSON.stringify(problem, null, 2)}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {pdfImportSummary ? (
                <div className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-3 text-[11px] text-[var(--text-color-secondary)]">
                  <span className="font-black text-[var(--text-color-primary)] uppercase tracking-wider text-[10px]">
                    Last Import Summary:
                  </span>{" "}
                  Requested {pdfImportSummary.requested || 0}, Inserted{" "}
                  {pdfImportSummary.inserted || 0}, Duplicates{" "}
                  {pdfImportSummary.duplicates || 0}, Invalid{" "}
                  {pdfImportSummary.invalid || 0}, Mode {pdfImportSummary.mode || "draft"}.
                </div>
              ) : null}
            </div>

            <div className="p-5 border-t border-[var(--border-color-primary)] flex flex-col md:flex-row gap-3">
              <button
                onClick={closePdfImportModal}
                className="flex-1 py-3 border border-[var(--border-color-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-background-elevated)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveParsedPdfProblems("draft")}
                disabled={pdfSaveLoading || pdfPreviewLoading}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60"
              >
                {pdfSaveLoading ? "Saving..." : "Save As Draft"}
              </button>
              <button
                onClick={() => handleSaveParsedPdfProblems("publish")}
                disabled={pdfSaveLoading || pdfPreviewLoading}
                className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-success-glow)] hover:brightness-110 transition-all disabled:opacity-60"
              >
                {pdfSaveLoading ? "Saving..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FaCircle className="text-[var(--color-primary)] text-[8px] animate-pulse" />
            <span className="text-[var(--color-primary)] text-[10px] font-black uppercase tracking-[0.3em]">
              Admin Core
            </span>
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase text-[var(--text-color-primary)]">
            Problem{" "}
            <span className="text-[var(--text-color-muted)] not-italic font-thin">
              Arena
            </span>
          </h2>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsJsonModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[var(--color-background-soft)] text-[var(--text-color-primary)] px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-[var(--border-color-primary)] hover:bg-[var(--color-background-elevated)] transition-all"
          >
            <FaFileImport /> Import JSON
          </button>
          <button
            onClick={openPdfImportModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[var(--color-background-soft)] text-[var(--text-color-primary)] px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-[var(--border-color-primary)] hover:bg-[var(--color-background-elevated)] transition-all"
          >
            <FaFilePdf /> Import PDF
          </button>
          <button
            onClick={openCreateEditor}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[var(--color-success-glow)]"
          >
            <FaPlus /> Create Problem
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Problems",
            val: problems.length,
            color: "text-blue-500",
          },
          {
            label: "Active",
            val: String(problems.filter((item) => item.isActive).length),
            color: "text-[var(--color-success)]",
          },
          {
            label: "Drafts",
            val: String(problems.filter((item) => !item.isActive).length),
            color: "text-amber-500",
          },
          {
            label: "Sync Status",
            val:
              jsonImportLoading ||
              listLoading ||
              pdfPreviewLoading ||
              pdfSaveLoading
                ? "Syncing"
                : "Live",
            color: "text-[var(--color-primary)]",
          },
        ].map((card, index) => (
          <div
            key={index}
            className="bg-[var(--color-background-soft)] p-4 rounded-2xl border border-[var(--border-color-primary)]"
          >
            <p className="text-[9px] font-black uppercase text-[var(--text-color-muted)] mb-1">
              {card.label}
            </p>
            <p className={`text-xl font-black ${card.color}`}>{card.val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 bg-[var(--color-background-soft)] p-3 rounded-2xl border border-[var(--border-color-primary)] shadow-sm">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-color-muted)]" />
          <input
            type="text"
            placeholder="Search by title, slug, or tags..."
            className="w-full pl-11 pr-4 py-2.5 bg-[var(--color-background-elevated)] border-none rounded-xl focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-background-elevated)] rounded-xl text-[10px] font-black uppercase border border-[var(--border-color-primary)]">
          <FaFilter /> Filter
        </button>
      </div>

      {listError ? (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-rose-500 text-sm font-bold">
          {listError}
        </div>
      ) : null}

      <div className="grid gap-3">
        {filteredProblems.map((problem) => (
          <div
            key={problem._id}
            className="group bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] p-4 rounded-2xl hover:border-[var(--color-primary)]/30 transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${problem.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : problem.difficulty === "Medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}
                  >
                    {problem.difficulty}
                  </span>
                  <span className="text-[var(--text-color-muted)] text-[10px] font-mono">
                    /{problem.slug}
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-[var(--text-color-primary)]">
                  {problem.title}
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditEditor(problem._id)}
                  disabled={detailLoading}
                  className="p-3 bg-[var(--color-secondary)] text-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition-all disabled:opacity-60"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(problem._id)}
                  disabled={deletingId === problem._id}
                  className="p-3 bg-[var(--color-danger-glow)] text-[var(--color-danger)] rounded-xl hover:bg-[var(--color-danger)] hover:text-white transition-all disabled:opacity-60"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!listLoading && filteredProblems.length === 0 ? (
        <div className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-2xl px-6 py-10 text-center">
          <p className="text-sm font-bold text-[var(--text-color-muted)]">
            No problems found for the current search.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between px-6 py-3 bg-[var(--color-primary-dark)] rounded-2xl text-white/90">
        <div className="flex items-center gap-3">
          <FaDatabase className="text-amber-400" size={12} />
          <p className="text-[9px] font-black uppercase tracking-widest">
            DB Status: <span className="text-emerald-300">Active Node</span>
          </p>
        </div>
        <p className="text-[8px] font-black opacity-40 uppercase tracking-[0.4em]">
          Orbiton CX v2.0
        </p>
      </div>
    </div>
  );
};

export default ProblemManagement;
