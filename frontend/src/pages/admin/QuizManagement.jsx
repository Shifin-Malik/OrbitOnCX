import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaRegClock,
  FaLayerGroup,
  FaListOl,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import QuizCreation from "../../components/admin/QuizCreation";
import {
  bulkCreateAdminQuizzes,
  clearBulkResult,
  clearPdfPreview,
  commitAdminQuizPdf,
  createAdminQuiz,
  deleteAdminQuiz,
  fetchAdminQuizById,
  fetchAdminQuizzes,
  previewAdminQuizPdf,
  toggleAdminQuizStatus,
  updateAdminQuiz,
} from "../../features/admin/adminQuizSlice.js";

const QuizManagement = () => {
  const dispatch = useDispatch();

  const {
    quizzes = [],
    pagination,
    listLoading,
    listError,
    selectedQuiz,
    detailLoading,
    submitting,
    deletingId,
    togglingId,
    bulkLoading,
    pdfPreview,
    pdfPreviewLoading,
    pdfCommitLoading,
  } = useSelector((state) => state.adminQuiz);

  const [activeView, setActiveView] = useState(null); // { mode: "create" | "edit", quizId?: string }

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    dispatch(fetchAdminQuizzes({ page: currentPage, limit: itemsPerPage }));
  }, [dispatch, currentPage]);

  const currentQuizzes = quizzes;
  const totalPages = pagination?.totalPages || 1;

  const paginate = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };

  const deleteQuiz = async (id) => {
    if (window.confirm("Are you sure you want to delete this blueprint?")) {
      try {
        await dispatch(deleteAdminQuiz(id)).unwrap();
        toast.success("Quiz deleted");
        if (currentQuizzes.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        } else {
          dispatch(fetchAdminQuizzes({ page: currentPage, limit: itemsPerPage }));
        }
      } catch (error) {
        toast.error(error || "Failed to delete quiz");
      }
    }
  };

  const handleToggleStatus = async (quiz) => {
    try {
      await dispatch(
        toggleAdminQuizStatus({
          quizId: quiz._id,
          isActive: !quiz.isActive,
        }),
      ).unwrap();
      toast.success(`Quiz marked as ${quiz.isActive ? "draft" : "published"}`);
    } catch (error) {
      toast.error(error || "Failed to update status");
    }
  };

  const handleEdit = async (quiz) => {
    setActiveView({ mode: "edit", quizId: quiz._id });
    try {
      await dispatch(fetchAdminQuizById(quiz._id)).unwrap();
    } catch (error) {
      toast.error(error || "Failed to load quiz details");
      setActiveView(null);
    }
  };

  const handleSave = async ({ quizData, questions }) => {
    const payload = { quizData, questions };

    try {
      if (activeView?.mode === "edit" && activeView.quizId) {
        await dispatch(
          updateAdminQuiz({ quizId: activeView.quizId, payload }),
        ).unwrap();
        toast.success("Quiz updated successfully");
      } else {
        await dispatch(createAdminQuiz(payload)).unwrap();
        toast.success("Quiz created successfully");
      }

      dispatch(fetchAdminQuizzes({ page: currentPage, limit: itemsPerPage }));
      dispatch(clearPdfPreview());
      dispatch(clearBulkResult());
      setActiveView(null);
    } catch (error) {
      toast.error(error || "Failed to save quiz");
    }
  };

  const handleBulkCreate = async (bulkPayload) => {
    const requestBody = Array.isArray(bulkPayload)
      ? { quizzes: bulkPayload }
      : bulkPayload;

    try {
      const result = await dispatch(
        bulkCreateAdminQuizzes(requestBody),
      ).unwrap();

      const successCount = result?.summary?.successCount || 0;
      const failedCount = result?.summary?.failedCount || 0;

      if (successCount > 0) {
        toast.success(`${successCount} quiz(s) created`);
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} item(s) failed validation`);
      }

      dispatch(fetchAdminQuizzes({ page: currentPage, limit: itemsPerPage }));
      if (successCount > 0 && failedCount === 0) {
        setActiveView(null);
      }

      return result;
    } catch (error) {
      const message =
        error?.message || error?.failed?.[0]?.errors?.[0] || "Bulk import failed";
      toast.error(message);
      throw error;
    }
  };

  const handlePreviewPdf = async ({ file, defaultDifficulty }) => {
    const formData = new FormData();
    formData.append("file", file);

    if (activeView?.mode === "edit" && activeView?.quizId) {
      formData.append("quizId", activeView.quizId);
    }

    if (defaultDifficulty) {
      formData.append("defaultDifficulty", defaultDifficulty);
    }

    const preview = await dispatch(previewAdminQuizPdf(formData)).unwrap();
    toast.success(
      `PDF parsed: ${preview?.meta?.validCount || 0} valid question(s)`,
    );
    return preview;
  };

  const handleCommitPdfImport = async ({ quizData, questions }) => {
    const payload =
      activeView?.mode === "edit" && activeView?.quizId
        ? { quizId: activeView.quizId, questions }
        : { quizData, questions };

    const data = await dispatch(commitAdminQuizPdf(payload)).unwrap();
    toast.success("PDF import saved successfully");

    dispatch(fetchAdminQuizzes({ page: currentPage, limit: itemsPerPage }));

    if (activeView?.mode === "edit" && activeView?.quizId) {
      await dispatch(fetchAdminQuizById(activeView.quizId));
    } else {
      dispatch(clearPdfPreview());
      setActiveView(null);
    }

    return data;
  };

  if (activeView) {
    const isEditMode = activeView.mode === "edit";
    const isEditLoading =
      isEditMode &&
      (detailLoading || selectedQuiz?._id !== activeView.quizId);

    return (
      <QuizCreation
        editData={isEditMode ? selectedQuiz : null}
        isEditLoading={isEditLoading}
        isSubmitting={
          submitting || bulkLoading || pdfPreviewLoading || pdfCommitLoading
        }
        pdfPreview={pdfPreview}
        onClearPdfPreview={() => dispatch(clearPdfPreview())}
        onBack={() => {
          dispatch(clearPdfPreview());
          dispatch(clearBulkResult());
          setActiveView(null);
        }}
        onSave={handleSave}
        onBulkCreate={handleBulkCreate}
        onPreviewPdf={handlePreviewPdf}
        onCommitPdfImport={handleCommitPdfImport}
      />
    );
  }

  if (listLoading && quizzes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="h-12 w-12 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-3.5 md:p-4 space-y-4 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 px-0.5">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_10px_var(--color-success-glow)] animate-pulse"></span>
            <p className="text-[var(--color-primary)] text-[9px] font-black uppercase tracking-[0.35em]">
              Repository Access
            </p>
          </div>
          <h2 className="text-4xl font-black text-[var(--text-color-primary)] tracking-tighter italic uppercase">
            ORBITON{" "}
            <span className="text-[var(--text-color-muted)] not-italic font-thin opacity-50">
              QUIZZES
            </span>
          </h2>
        </div>

        <button
          onClick={() => {
            dispatch(clearPdfPreview());
            dispatch(clearBulkResult());
            setActiveView({ mode: "create" });
          }}
          className="group flex items-center gap-2.5 bg-[var(--color-primary)] text-white px-7 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--color-primary-dark)] transition-all shadow-lg shadow-[var(--color-success-glow)]"
        >
          <FaPlus
            size={12}
            className="group-hover:rotate-90 transition-transform"
          />
          Create New Quiz
        </button>
      </div>

      {listError ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-glow)] px-4 py-3 text-[11px] font-bold text-[var(--color-danger)]">
          {listError}
        </div>
      ) : null}

      <div className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-[2rem] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-background-elevated)] border-b border-[var(--border-color-primary)]">
                <th className="px-9 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)]">
                  Quiz Blueprint
                </th>
                <th className="px-9 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)] text-center">
                  Structure
                </th>
                <th className="px-9 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)]">
                  Lifecycle
                </th>
                <th className="px-9 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color-secondary)]">
              {currentQuizzes.map((quiz) => (
                <tr
                  key={quiz._id}
                  className="group/row hover:bg-[var(--color-accent-glow)] transition-all duration-300"
                >
                  <td className="px-9 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-black text-lg">
                        {quiz.title?.charAt(0) || "Q"}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-[var(--text-color-primary)] group-hover/row:text-[var(--color-primary)] transition-colors">
                          {quiz.title || "Untitled Quiz"}
                        </p>
                        <div className="flex items-center gap-1.5 text-[var(--text-color-muted)] mt-0.5">
                          <FaLayerGroup size={9} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            {quiz.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-9 py-5">
                    <div className="flex items-center justify-center gap-7 text-[var(--text-color-secondary)]">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 font-black text-base">
                          <FaListOl className="text-[var(--color-primary)] opacity-40 text-[10px]" />
                          {quiz.totalQuestions || 0}
                        </div>
                        <span className="text-[8px] uppercase font-bold text-[var(--text-color-muted)] tracking-widest">
                          Items
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 font-black text-base">
                          <FaRegClock className="text-[var(--color-accent)] text-[10px]" />
                          {Math.max(1, Math.ceil((quiz.timeLimit || 600) / 60))}
                        </div>
                        <span className="text-[8px] uppercase font-bold text-[var(--text-color-muted)] tracking-widest">
                          Min
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-9 py-5">
                    <button
                      onClick={() => handleToggleStatus(quiz)}
                      disabled={togglingId === quiz._id}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-[9px] font-black tracking-widest uppercase 
                      ${quiz.isActive
                          ? "bg-[var(--color-success-glow)] border-[var(--color-success)]/20 text-[var(--color-success)]"
                          : "bg-[var(--color-background-elevated)] border-[var(--border-color-primary)] text-[var(--text-color-muted)]"
                      } disabled:opacity-60`}
                    >
                      {quiz.isActive ? (
                        <FaCheckCircle size={10} />
                      ) : (
                        <FaTimesCircle size={10} />
                      )}
                      {quiz.isActive ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-9 py-5 text-right">
                    <div className="flex justify-end gap-2.5 opacity-0 group-hover/row:opacity-100 translate-x-3 group-hover/row:translate-x-0 transition-all duration-300">
                      <button
                        onClick={() => handleEdit(quiz)}
                        disabled={detailLoading}
                        className="p-2.5 rounded-lg border border-[var(--border-color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-all"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => deleteQuiz(quiz._id)}
                        disabled={deletingId === quiz._id}
                        className="p-2.5 rounded-lg border border-[var(--border-color-primary)] text-[var(--color-danger)] hover:bg-[var(--color-danger-glow)] transition-all"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentQuizzes.length === 0 ? (
          <div className="px-8 py-10 text-center text-[var(--text-color-muted)] text-sm font-bold">
            No quizzes found. Create your first quiz to get started.
          </div>
        ) : null}

        <div className="px-8 py-5 bg-[var(--color-background-elevated)] border-t border-[var(--border-color-primary)] flex justify-between items-center">
          <span className="text-[10px] font-black text-[var(--text-color-muted)] uppercase tracking-[0.2em]">
            Page {currentPage} / {totalPages}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[var(--text-color-primary)] hover:border-[var(--color-primary)] transition-all disabled:opacity-20 shadow-lg"
            >
              <FaChevronLeft size={10} />
            </button>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] text-[var(--text-color-primary)] hover:border-[var(--color-primary)] transition-all disabled:opacity-20 shadow-lg"
            >
              <FaChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizManagement;
