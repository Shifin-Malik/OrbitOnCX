import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaEdit,
  FaTrash,
  FaFileImport,
  FaDatabase,
  FaCircle,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import ProblemEditor from "../../components/admin/ProblemEditor.jsx";
import {
  clearSelectedAdminProblem,
  createAdminProblem,
  createProblemFromJson,
  deleteAdminProblem,
  fetchAdminProblems,
  fetchProblemForEditor,
  importAdminProblemsFromJsonBulk,
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
  } = useSelector((state) => state.adminProblem);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

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

  const refreshProblems = () =>
    dispatch(fetchAdminProblems({ page: 1, limit: 100, sort: "newest" }));

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
            val: jsonImportLoading || listLoading ? "Syncing" : "Live",
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
