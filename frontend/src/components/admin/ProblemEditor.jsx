import React, { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaSave,
  FaCode,
  FaFlask,
  FaListUl,
  FaFileImport,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  buildProblemPayload,
  createEmptyProblemForm,
  normalizeProblemForForm,
} from "../../features/admin/adminProblemFormUtils.js";

const toJsonText = (value) => JSON.stringify(value, null, 2);

const ProblemEditor = ({
  editData,
  isEditLoading = false,
  isSaving = false,
  isJsonSaving = false,
  onBack,
  onSave,
  onSaveFromJson,
}) => {
  const [activeTab, setActiveTab] = useState("general");
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonPaste, setJsonPaste] = useState("");
  const [jsonError, setJsonError] = useState("");

  const [formData, setFormData] = useState(() => createEmptyProblemForm());

  useEffect(() => {
    setFormData(normalizeProblemForForm(editData));
  }, [editData]);

  useEffect(() => {
    if (!isJsonModalOpen) return;

    const payload = buildProblemPayload(formData);
    setJsonPaste(toJsonText(payload));
    setJsonError("");
  }, [isJsonModalOpen, formData]);

  const isBusy = isSaving || isJsonSaving;

  const parsedPreview = useMemo(() => {
    if (!jsonPaste.trim()) return null;
    try {
      const parsed = JSON.parse(jsonPaste);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return {
        title: parsed.title || "-",
        difficulty: parsed.difficulty || "-",
        slug: parsed.slug || "(auto from title)",
      };
    } catch {
      return null;
    }
  }, [jsonPaste]);

  const parseJsonObject = () => {
    let parsed;
    try {
      parsed = JSON.parse(jsonPaste);
    } catch {
      const message = "Invalid JSON format. Please fix syntax and try again.";
      setJsonError(message);
      throw new Error(message);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      const message = "JSON must be a single object for editor save.";
      setJsonError(message);
      throw new Error(message);
    }

    setJsonError("");
    return parsed;
  };

  const handleProcessJson = () => {
    try {
      const parsed = parseJsonObject();
      const normalized = normalizeProblemForForm(parsed);
      setFormData(normalized);
      toast.success("JSON loaded into form.");
    } catch (error) {
      toast.error(error.message || "Invalid JSON");
    }
  };

  const handleSaveFromJson = async () => {
    if (!onSaveFromJson) {
      toast.error("JSON save handler is not connected.");
      return;
    }

    try {
      const parsed = parseJsonObject();
      const saved = await onSaveFromJson(parsed);
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        const normalized = normalizeProblemForForm(saved);
        setFormData(normalized);
        setJsonPaste(toJsonText(buildProblemPayload(normalized)));
      }

      setIsJsonModalOpen(false);
    } catch {
      // Error toast is handled by parent callback; keep modal content untouched.
    }
  };

  const updateArrayField = (field, index, value) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const handleManualSave = async () => {
    if (!onSave) return;

    try {
      const payload = buildProblemPayload(formData);
      await onSave(payload);
    } catch {
      // parent handles toast/errors
    }
  };

  if (isEditLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="h-12 w-12 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8 space-y-6 relative">
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[var(--color-background-soft)] w-full max-w-2xl rounded-[2.5rem] border border-[var(--border-color-primary)] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--border-color-primary)] flex justify-between items-center bg-[var(--color-background-elevated)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-primary)] rounded-lg text-white">
                  <FaFileImport size={14} />
                </div>
                <h3 className="font-black uppercase italic tracking-tighter text-lg">
                  JSON{" "}
                  <span className="text-[var(--color-primary)]">Importer</span>
                </h3>
              </div>
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="text-[var(--text-color-muted)] hover:text-rose-500 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[10px] font-bold text-[var(--text-color-muted)] uppercase tracking-widest px-1">
                Paste editable JSON object:
              </p>
              <textarea
                className="w-full h-64 bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-2xl p-4 text-xs font-mono text-[var(--color-primary)] outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder='{ "title": "Example...", "difficulty": "Easy", ... }'
                value={jsonPaste}
                onChange={(event) => setJsonPaste(event.target.value)}
              />

              {jsonError ? (
                <div className="text-xs font-bold text-rose-500 flex items-center gap-2">
                  <FaExclamationCircle /> {jsonError}
                </div>
              ) : null}

              {parsedPreview ? (
                <div className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-3 text-[11px]">
                  <p>
                    <span className="font-black">Title:</span> {parsedPreview.title}
                  </p>
                  <p>
                    <span className="font-black">Difficulty:</span>{" "}
                    {parsedPreview.difficulty}
                  </p>
                  <p>
                    <span className="font-black">Slug:</span> {parsedPreview.slug}
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setIsJsonModalOpen(false)}
                  className="py-3 border border-[var(--border-color-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-background-elevated)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessJson}
                  className="py-3 bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-secondary)] transition-all"
                >
                  Process & Load
                </button>
                <button
                  onClick={handleSaveFromJson}
                  disabled={isJsonSaving}
                  className="py-3 bg-[var(--color-primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-success-glow)] hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {isJsonSaving ? "Saving..." : "Save JSON"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[var(--color-background-soft)] p-4 rounded-3xl border border-[var(--border-color-primary)] shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-[var(--color-background-elevated)] rounded-2xl hover:bg-[var(--color-primary)] hover:text-white transition-all"
          >
            <FaArrowLeft size={16} />
          </button>
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter">
              Manage <span className="text-[var(--color-primary)]">Engine</span>
            </h3>
            <p className="text-[9px] font-bold text-[var(--text-color-muted)] uppercase tracking-widest">
              {formData.slug || "Drafting New Problem"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <button
            onClick={() => setIsJsonModalOpen(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-background-elevated)] rounded-2xl text-[10px] font-black uppercase border border-[var(--border-color-primary)] hover:bg-[var(--color-secondary)] transition-all"
          >
            <FaFileImport /> Import JSON
          </button>
          <button
            onClick={handleManualSave}
            disabled={isBusy}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--color-primary)] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--color-success-glow)] hover:brightness-110 transition-all active:scale-95 disabled:opacity-60"
          >
            <FaSave /> {isSaving ? "Saving..." : "Commit Problem"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 space-y-2">
          {[
            { id: "general", label: "Core Details", icon: FaListUl },
            { id: "technical", label: "Starter Code", icon: FaCode },
            { id: "testcases", label: "Test Laboratory", icon: FaFlask },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-[var(--color-primary)] text-white shadow-lg" : "bg-[var(--color-background-soft)] text-[var(--text-color-muted)] border border-[var(--border-color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-background-elevated)]"}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-[2.5rem] p-6 md:p-10 min-h-[60vh] shadow-sm">
          {activeTab === "general" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-color-muted)] ml-1 tracking-widest">
                    Title
                  </label>
                  <input
                    value={formData.title}
                    onChange={(event) =>
                      setFormData({ ...formData, title: event.target.value })
                    }
                    className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-4 text-sm font-bold focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    placeholder="e.g. Reverse Linked List"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-color-muted)] ml-1 tracking-widest">
                    Slug (URL)
                  </label>
                  <input
                    value={formData.slug}
                    onChange={(event) =>
                      setFormData({ ...formData, slug: event.target.value })
                    }
                    className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-4 text-sm font-mono opacity-70 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[var(--text-color-muted)] ml-1 tracking-widest">
                  Problem Description
                </label>
                <textarea
                  rows="8"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({ ...formData, description: event.target.value })
                  }
                  className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-2xl p-5 text-sm leading-relaxed focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                  placeholder="Write problem details here..."
                />
              </div>
            </div>
          )}

          {activeTab === "technical" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
              {["javascript", "python", "cpp", "java"].map((lang) => (
                <div key={lang} className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase text-[var(--color-primary)] ml-1 tracking-widest flex items-center gap-2">
                    <FaCode size={10} /> {lang} Boilerplate
                  </label>
                  <textarea
                    value={formData.starterCode[lang]}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        starterCode: {
                          ...formData.starterCode,
                          [lang]: event.target.value,
                        },
                      })
                    }
                    rows="5"
                    className="w-full bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-4 text-xs font-mono text-[var(--color-primary-dark)] focus:border-[var(--color-primary)]/50 outline-none transition-all"
                    placeholder={`// Enter ${lang} code template...`}
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === "testcases" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)]">
                  Live Test Suite
                </h4>
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      visibleTestCases: [
                        ...formData.visibleTestCases,
                        { input: "", output: "" },
                      ],
                    })
                  }
                  className="text-[10px] font-black bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl hover:scale-105 transition-transform"
                >
                  + Add Case
                </button>
              </div>
              <div className="grid gap-4">
                {formData.visibleTestCases.map((testCase, i) => (
                  <div
                    key={i}
                    className="grid md:grid-cols-2 gap-4 bg-[var(--color-background-elevated)] p-5 rounded-3xl border border-[var(--border-color-primary)] relative group"
                  >
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-[var(--text-color-muted)]">
                        Input
                      </label>
                      <textarea
                        placeholder="e.g. nums = [1,2], target = 3"
                        value={testCase.input}
                        onChange={(event) =>
                          updateArrayField("visibleTestCases", i, {
                            ...testCase,
                            input: event.target.value,
                          })
                        }
                        className="w-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-xl p-3 text-xs font-mono outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-[var(--text-color-muted)]">
                        Output
                      </label>
                      <textarea
                        placeholder="e.g. [0,1]"
                        value={testCase.output}
                        onChange={(event) =>
                          updateArrayField("visibleTestCases", i, {
                            ...testCase,
                            output: event.target.value,
                          })
                        }
                        className="w-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-xl p-3 text-xs font-mono outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          visibleTestCases: formData.visibleTestCases.filter(
                            (_, idx) => idx !== i,
                          ),
                        })
                      }
                      className="absolute -top-2 -right-2 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[var(--border-color-primary)]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)]">
                    Hidden Test Suite
                  </h4>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        hiddenTestCases: [
                          ...formData.hiddenTestCases,
                          { input: "", output: "" },
                        ],
                      })
                    }
                    className="text-[10px] font-black bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl hover:scale-105 transition-transform"
                  >
                    + Add Hidden Case
                  </button>
                </div>
                <div className="grid gap-4">
                  {formData.hiddenTestCases.map((testCase, i) => (
                    <div
                      key={`hidden-${i}`}
                      className="grid md:grid-cols-2 gap-4 bg-[var(--color-background-elevated)] p-5 rounded-3xl border border-[var(--border-color-primary)] relative group"
                    >
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-[var(--text-color-muted)]">
                          Input
                        </label>
                        <textarea
                          value={testCase.input}
                          onChange={(event) =>
                            updateArrayField("hiddenTestCases", i, {
                              ...testCase,
                              input: event.target.value,
                            })
                          }
                          className="w-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-xl p-3 text-xs font-mono outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-[var(--text-color-muted)]">
                          Output
                        </label>
                        <textarea
                          value={testCase.output}
                          onChange={(event) =>
                            updateArrayField("hiddenTestCases", i, {
                              ...testCase,
                              output: event.target.value,
                            })
                          }
                          className="w-full bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-xl p-3 text-xs font-mono outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            hiddenTestCases: formData.hiddenTestCases.filter(
                              (_, idx) => idx !== i,
                            ),
                          })
                        }
                        className="absolute -top-2 -right-2 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-color-muted)]">
                <FaCheckCircle className="text-emerald-500" /> Ensure each test case has input and output before final save.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemEditor;
