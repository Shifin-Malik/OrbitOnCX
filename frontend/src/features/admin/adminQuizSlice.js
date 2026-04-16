import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addAdminQuizQuestionAPI,
  bulkAddAdminQuizQuestionsAPI,
  commitAdminQuizPdfAPI,
  createAdminQuizAPI,
  deleteAdminQuizAPI,
  deleteAdminQuizQuestionAPI,
  fetchAdminQuizByIdAPI,
  fetchAdminQuizzesAPI,
  previewAdminQuizPdfAPI,
  toggleAdminQuizStatusAPI,
  updateAdminQuizAPI,
  updateAdminQuizQuestionAPI,
} from "./adminQuizApi.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.errors?.[0] ||
  error?.message ||
  fallback;

const upsertQuizInList = (state, quiz) => {
  if (!quiz?._id) return;
  const index = state.quizzes.findIndex((item) => item._id === quiz._id);
  if (index >= 0) {
    state.quizzes[index] = { ...state.quizzes[index], ...quiz };
    return;
  }

  state.quizzes.unshift(quiz);
};

const updateQuizCountInList = (state, quizId, totalQuestions) => {
  const index = state.quizzes.findIndex((item) => item._id === String(quizId));
  if (index >= 0) {
    state.quizzes[index].totalQuestions = totalQuestions;
  }
};

export const fetchAdminQuizzes = createAsyncThunk(
  "adminQuiz/fetchAdminQuizzes",
  async (params = {}, thunkAPI) => {
    try {
      const { data } = await fetchAdminQuizzesAPI(params);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to fetch quizzes"),
      );
    }
  },
);

export const fetchAdminQuizById = createAsyncThunk(
  "adminQuiz/fetchAdminQuizById",
  async (quizId, thunkAPI) => {
    try {
      const { data } = await fetchAdminQuizByIdAPI(quizId, {
        includeQuestions: true,
      });
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to fetch quiz details"),
      );
    }
  },
);

export const createAdminQuiz = createAsyncThunk(
  "adminQuiz/createAdminQuiz",
  async (payload, thunkAPI) => {
    try {
      const { data } = await createAdminQuizAPI(payload);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to create quiz"),
      );
    }
  },
);

export const updateAdminQuiz = createAsyncThunk(
  "adminQuiz/updateAdminQuiz",
  async ({ quizId, payload }, thunkAPI) => {
    try {
      const { data } = await updateAdminQuizAPI(quizId, payload);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to update quiz"),
      );
    }
  },
);

export const deleteAdminQuiz = createAsyncThunk(
  "adminQuiz/deleteAdminQuiz",
  async (quizId, thunkAPI) => {
    try {
      const { data } = await deleteAdminQuizAPI(quizId);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to delete quiz"),
      );
    }
  },
);

export const toggleAdminQuizStatus = createAsyncThunk(
  "adminQuiz/toggleAdminQuizStatus",
  async ({ quizId, isActive }, thunkAPI) => {
    try {
      const { data } = await toggleAdminQuizStatusAPI(quizId, isActive);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to toggle quiz status"),
      );
    }
  },
);

export const previewAdminQuizPdf = createAsyncThunk(
  "adminQuiz/previewAdminQuizPdf",
  async (formData, thunkAPI) => {
    try {
      const { data } = await previewAdminQuizPdfAPI(formData);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data || getErrorMessage(error, "PDF preview failed"),
      );
    }
  },
);

export const commitAdminQuizPdf = createAsyncThunk(
  "adminQuiz/commitAdminQuizPdf",
  async (payload, thunkAPI) => {
    try {
      const { data } = await commitAdminQuizPdfAPI(payload);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data || getErrorMessage(error, "Failed to save PDF import"),
      );
    }
  },
);

export const addAdminQuizQuestion = createAsyncThunk(
  "adminQuiz/addAdminQuizQuestion",
  async ({ quizId, question }, thunkAPI) => {
    try {
      const { data } = await addAdminQuizQuestionAPI(quizId, question);
      return { quizId, question: data?.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to add question"),
      );
    }
  },
);

export const bulkAddAdminQuizQuestions = createAsyncThunk(
  "adminQuiz/bulkAddAdminQuizQuestions",
  async ({ quizId, questions }, thunkAPI) => {
    try {
      const { data } = await bulkAddAdminQuizQuestionsAPI(quizId, questions);
      return { quizId, questions: data?.data || [] };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to add questions"),
      );
    }
  },
);

export const updateAdminQuizQuestion = createAsyncThunk(
  "adminQuiz/updateAdminQuizQuestion",
  async ({ questionId, payload }, thunkAPI) => {
    try {
      const { data } = await updateAdminQuizQuestionAPI(questionId, payload);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to update question"),
      );
    }
  },
);

export const deleteAdminQuizQuestion = createAsyncThunk(
  "adminQuiz/deleteAdminQuizQuestion",
  async (questionId, thunkAPI) => {
    try {
      const { data } = await deleteAdminQuizQuestionAPI(questionId);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to delete question"),
      );
    }
  },
);

const initialState = {
  quizzes: [],
  pagination: {
    page: 1,
    limit: 5,
    totalPages: 1,
    total: 0,
  },
  listLoading: false,
  listError: null,

  selectedQuiz: null,
  detailLoading: false,
  detailError: null,

  submitting: false,
  submitError: null,

  deletingId: null,
  togglingId: null,
  actionError: null,

  pdfPreview: null,
  pdfPreviewLoading: false,
  pdfPreviewError: null,
  pdfCommitLoading: false,
  pdfCommitError: null,

  questionActionLoading: false,
  questionActionError: null,
};

const adminQuizSlice = createSlice({
  name: "adminQuiz",
  initialState,
  reducers: {
    clearSelectedQuiz: (state) => {
      state.selectedQuiz = null;
      state.detailError = null;
    },
    clearPdfPreview: (state) => {
      state.pdfPreview = null;
      state.pdfPreviewError = null;
    },
    clearAdminQuizErrors: (state) => {
      state.listError = null;
      state.detailError = null;
      state.submitError = null;
      state.actionError = null;
      state.pdfPreviewError = null;
      state.pdfCommitError = null;
      state.questionActionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminQuizzes.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchAdminQuizzes.fulfilled, (state, action) => {
        state.listLoading = false;
        state.quizzes = action.payload?.data || [];
        state.pagination = {
          page: action.payload?.pagination?.page || 1,
          limit: action.payload?.pagination?.limit || 5,
          totalPages: action.payload?.pagination?.totalPages || 1,
          total: action.payload?.total ?? action.payload?.count ?? state.quizzes.length,
        };
      })
      .addCase(fetchAdminQuizzes.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      })

      .addCase(fetchAdminQuizById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchAdminQuizById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedQuiz = action.payload || null;
        upsertQuizInList(state, action.payload);
      })
      .addCase(fetchAdminQuizById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      })

      .addCase(createAdminQuiz.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(createAdminQuiz.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedQuiz = action.payload || null;
        upsertQuizInList(state, action.payload);
      })
      .addCase(createAdminQuiz.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })

      .addCase(updateAdminQuiz.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(updateAdminQuiz.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedQuiz = action.payload || null;
        upsertQuizInList(state, action.payload);
      })
      .addCase(updateAdminQuiz.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })

      .addCase(deleteAdminQuiz.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.actionError = null;
      })
      .addCase(deleteAdminQuiz.fulfilled, (state, action) => {
        state.deletingId = null;
        const deletedId = action.payload?._id;
        state.quizzes = state.quizzes.filter((quiz) => quiz._id !== String(deletedId));
        if (state.selectedQuiz?._id === String(deletedId)) {
          state.selectedQuiz = null;
        }
      })
      .addCase(deleteAdminQuiz.rejected, (state, action) => {
        state.deletingId = null;
        state.actionError = action.payload;
      })

      .addCase(toggleAdminQuizStatus.pending, (state, action) => {
        state.togglingId = action.meta.arg?.quizId || null;
      })
      .addCase(toggleAdminQuizStatus.fulfilled, (state, action) => {
        state.togglingId = null;
        upsertQuizInList(state, action.payload);
        if (state.selectedQuiz?._id === action.payload?._id) {
          state.selectedQuiz = { ...state.selectedQuiz, ...action.payload };
        }
      })
      .addCase(toggleAdminQuizStatus.rejected, (state, action) => {
        state.togglingId = null;
        state.actionError = action.payload;
      })

      .addCase(previewAdminQuizPdf.pending, (state) => {
        state.pdfPreviewLoading = true;
        state.pdfPreviewError = null;
      })
      .addCase(previewAdminQuizPdf.fulfilled, (state, action) => {
        state.pdfPreviewLoading = false;
        state.pdfPreview = action.payload || null;
      })
      .addCase(previewAdminQuizPdf.rejected, (state, action) => {
        state.pdfPreviewLoading = false;
        state.pdfPreview = null;
        state.pdfPreviewError = action.payload;
      })

      .addCase(commitAdminQuizPdf.pending, (state) => {
        state.pdfCommitLoading = true;
        state.pdfCommitError = null;
      })
      .addCase(commitAdminQuizPdf.fulfilled, (state, action) => {
        state.pdfCommitLoading = false;
        state.pdfPreview = null;
        state.selectedQuiz = action.payload || null;
        upsertQuizInList(state, action.payload);
      })
      .addCase(commitAdminQuizPdf.rejected, (state, action) => {
        state.pdfCommitLoading = false;
        state.pdfCommitError = action.payload;
      })

      .addCase(addAdminQuizQuestion.pending, (state) => {
        state.questionActionLoading = true;
        state.questionActionError = null;
      })
      .addCase(addAdminQuizQuestion.fulfilled, (state, action) => {
        state.questionActionLoading = false;
        const { quizId, question } = action.payload || {};
        if (state.selectedQuiz?._id === String(quizId) && question) {
          const nextQuestions = [...(state.selectedQuiz.questions || []), question];
          state.selectedQuiz.questions = nextQuestions;
          state.selectedQuiz.totalQuestions = nextQuestions.length;
          updateQuizCountInList(state, quizId, nextQuestions.length);
        }
      })
      .addCase(addAdminQuizQuestion.rejected, (state, action) => {
        state.questionActionLoading = false;
        state.questionActionError = action.payload;
      })

      .addCase(bulkAddAdminQuizQuestions.pending, (state) => {
        state.questionActionLoading = true;
        state.questionActionError = null;
      })
      .addCase(bulkAddAdminQuizQuestions.fulfilled, (state, action) => {
        state.questionActionLoading = false;
        const { quizId, questions } = action.payload || {};
        if (state.selectedQuiz?._id === String(quizId)) {
          const nextQuestions = [...(state.selectedQuiz.questions || []), ...questions];
          state.selectedQuiz.questions = nextQuestions;
          state.selectedQuiz.totalQuestions = nextQuestions.length;
          updateQuizCountInList(state, quizId, nextQuestions.length);
        }
      })
      .addCase(bulkAddAdminQuizQuestions.rejected, (state, action) => {
        state.questionActionLoading = false;
        state.questionActionError = action.payload;
      })

      .addCase(updateAdminQuizQuestion.pending, (state) => {
        state.questionActionLoading = true;
        state.questionActionError = null;
      })
      .addCase(updateAdminQuizQuestion.fulfilled, (state, action) => {
        state.questionActionLoading = false;
        if (!action.payload?._id || !state.selectedQuiz?.questions) return;
        state.selectedQuiz.questions = state.selectedQuiz.questions.map((question) =>
          question._id === action.payload._id ? action.payload : question,
        );
      })
      .addCase(updateAdminQuizQuestion.rejected, (state, action) => {
        state.questionActionLoading = false;
        state.questionActionError = action.payload;
      })

      .addCase(deleteAdminQuizQuestion.pending, (state) => {
        state.questionActionLoading = true;
        state.questionActionError = null;
      })
      .addCase(deleteAdminQuizQuestion.fulfilled, (state, action) => {
        state.questionActionLoading = false;
        const quizId = action.payload?.quizId;
        const questionId = action.payload?._id;
        if (
          state.selectedQuiz?._id === String(quizId) &&
          Array.isArray(state.selectedQuiz.questions)
        ) {
          const nextQuestions = state.selectedQuiz.questions.filter(
            (question) => question._id !== String(questionId),
          );
          state.selectedQuiz.questions = nextQuestions;
          state.selectedQuiz.totalQuestions = nextQuestions.length;
          updateQuizCountInList(state, quizId, nextQuestions.length);
        }
      })
      .addCase(deleteAdminQuizQuestion.rejected, (state, action) => {
        state.questionActionLoading = false;
        state.questionActionError = action.payload;
      });
  },
});

export const {
  clearSelectedQuiz,
  clearPdfPreview,
  clearAdminQuizErrors,
} = adminQuizSlice.actions;

export default adminQuizSlice.reducer;
