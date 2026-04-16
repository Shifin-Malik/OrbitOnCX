import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  bulkCreateProblemsFromJsonAPI,
  createProblemAPI,
  createProblemFromJsonAPI,
  deleteProblemAPI,
  getAdminProblemsAPI,
  getProblemByIdAPI,
  previewProblemPdfImportAPI,
  saveProblemPdfImportAPI,
  toggleProblemStatusAPI,
  updateProblemFromJsonAPI,
  updateProblemAPI,
} from "./adminProblemApi.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.errors?.[0] ||
  error?.message ||
  fallback;

const upsertProblemInList = (state, problem) => {
  if (!problem?._id) return;
  const index = state.problems.findIndex((item) => item._id === problem._id);
  if (index >= 0) {
    state.problems[index] = { ...state.problems[index], ...problem };
    return;
  }

  state.problems.unshift(problem);
};

export const fetchAdminProblems = createAsyncThunk(
  "adminProblem/fetchAdminProblems",
  async (params = {}, thunkAPI) => {
    try {
      const { data } = await getAdminProblemsAPI(params);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to fetch problems"),
      );
    }
  },
);

export const fetchAdminProblemById = createAsyncThunk(
  "adminProblem/fetchAdminProblemById",
  async (problemId, thunkAPI) => {
    try {
      const { data } = await getProblemByIdAPI(problemId);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to fetch problem details"),
      );
    }
  },
);

export const fetchProblemForEditor = fetchAdminProblemById;

export const createAdminProblem = createAsyncThunk(
  "adminProblem/createAdminProblem",
  async (payload, thunkAPI) => {
    try {
      const { data } = await createProblemAPI(payload);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to create problem"),
      );
    }
  },
);

export const createProblemFromJson = createAsyncThunk(
  "adminProblem/createProblemFromJson",
  async (payload, thunkAPI) => {
    try {
      const { data } = await createProblemFromJsonAPI(payload);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to import problem JSON"),
      );
    }
  },
);

export const importAdminProblemFromJson = createProblemFromJson;

export const importAdminProblemsFromJsonBulk = createAsyncThunk(
  "adminProblem/importAdminProblemsFromJsonBulk",
  async (payload, thunkAPI) => {
    try {
      const requestBody = Array.isArray(payload) ? payload : payload?.problems || [];
      const { data } = await bulkCreateProblemsFromJsonAPI(requestBody);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data || getErrorMessage(error, "Failed to import bulk JSON"),
      );
    }
  },
);

export const previewAdminProblemPdfImport = createAsyncThunk(
  "adminProblem/previewAdminProblemPdfImport",
  async (formData, thunkAPI) => {
    try {
      const { data } = await previewProblemPdfImportAPI(formData);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data || getErrorMessage(error, "Failed to parse PDF"),
      );
    }
  },
);

export const saveAdminProblemPdfImport = createAsyncThunk(
  "adminProblem/saveAdminProblemPdfImport",
  async ({ problems, mode }, thunkAPI) => {
    try {
      const payload = {
        problems: Array.isArray(problems) ? problems : [],
        mode,
      };
      const { data } = await saveProblemPdfImportAPI(payload);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data || getErrorMessage(error, "Failed to save PDF import"),
      );
    }
  },
);

export const updateProblemFromJson = createAsyncThunk(
  "adminProblem/updateProblemFromJson",
  async ({ problemId, payload }, thunkAPI) => {
    try {
      const { data } = await updateProblemFromJsonAPI(problemId, payload);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to update problem from JSON"),
      );
    }
  },
);

export const updateAdminProblem = createAsyncThunk(
  "adminProblem/updateAdminProblem",
  async ({ problemId, payload }, thunkAPI) => {
    try {
      const { data } = await updateProblemAPI(problemId, payload);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to update problem"),
      );
    }
  },
);

export const deleteAdminProblem = createAsyncThunk(
  "adminProblem/deleteAdminProblem",
  async (problemId, thunkAPI) => {
    try {
      const { data } = await deleteProblemAPI(problemId);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to delete problem"),
      );
    }
  },
);

export const toggleAdminProblemStatus = createAsyncThunk(
  "adminProblem/toggleAdminProblemStatus",
  async ({ problemId, isActive }, thunkAPI) => {
    try {
      const { data } = await toggleProblemStatusAPI(problemId, isActive);
      return data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to toggle problem status"),
      );
    }
  },
);

const initialState = {
  problems: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: "",
    difficulty: "all",
    status: "all",
    sort: "newest",
  },

  listLoading: false,
  listError: null,

  selectedProblem: null,
  detailLoading: false,
  detailError: null,

  submitting: false,
  submitError: null,

  deletingId: null,
  togglingId: null,
  actionError: null,

  jsonImportLoading: false,
  jsonImportError: null,
  jsonImportSummary: null,

  pdfPreview: null,
  pdfPreviewLoading: false,
  pdfPreviewError: null,

  pdfSaveLoading: false,
  pdfSaveError: null,
  pdfImportSummary: null,
};

const adminProblemSlice = createSlice({
  name: "adminProblem",
  initialState,
  reducers: {
    setAdminProblemFilters: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
    },
    setAdminProblemPage: (state, { payload }) => {
      state.pagination.page = payload;
    },
    setAdminProblemLimit: (state, { payload }) => {
      state.pagination.limit = payload;
      state.pagination.page = 1;
    },
    clearSelectedAdminProblem: (state) => {
      state.selectedProblem = null;
      state.detailError = null;
    },
    clearAdminProblemErrors: (state) => {
      state.listError = null;
      state.detailError = null;
      state.submitError = null;
      state.actionError = null;
      state.jsonImportError = null;
      state.pdfPreviewError = null;
      state.pdfSaveError = null;
    },
    clearProblemPdfPreview: (state) => {
      state.pdfPreview = null;
      state.pdfPreviewError = null;
      state.pdfSaveError = null;
      state.pdfImportSummary = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminProblems.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchAdminProblems.fulfilled, (state, action) => {
        state.listLoading = false;
        state.problems = action.payload?.data || [];
        state.pagination = {
          page: action.payload?.pagination?.page || 1,
          limit: action.payload?.pagination?.limit || 10,
          total: action.payload?.pagination?.total || 0,
          totalPages: action.payload?.pagination?.totalPages || 1,
          hasNextPage: Boolean(action.payload?.pagination?.hasNextPage),
          hasPrevPage: Boolean(action.payload?.pagination?.hasPrevPage),
        };
      })
      .addCase(fetchAdminProblems.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      })

      .addCase(fetchAdminProblemById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchAdminProblemById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedProblem = action.payload || null;
        upsertProblemInList(state, action.payload);
      })
      .addCase(fetchAdminProblemById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      })

      .addCase(createAdminProblem.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(createAdminProblem.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedProblem = action.payload || null;
        upsertProblemInList(state, action.payload);
      })
      .addCase(createAdminProblem.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })

      .addCase(createProblemFromJson.pending, (state) => {
        state.jsonImportLoading = true;
        state.jsonImportError = null;
        state.jsonImportSummary = null;
      })
      .addCase(createProblemFromJson.fulfilled, (state, action) => {
        state.jsonImportLoading = false;
        upsertProblemInList(state, action.payload);
        state.selectedProblem = action.payload || null;
        state.jsonImportSummary = {
          total: 1,
          successCount: action.payload?._id ? 1 : 0,
          failedCount: action.payload?._id ? 0 : 1,
        };
      })
      .addCase(createProblemFromJson.rejected, (state, action) => {
        state.jsonImportLoading = false;
        state.jsonImportError = action.payload;
      })

      .addCase(importAdminProblemsFromJsonBulk.pending, (state) => {
        state.jsonImportLoading = true;
        state.jsonImportError = null;
        state.jsonImportSummary = null;
      })
      .addCase(importAdminProblemsFromJsonBulk.fulfilled, (state, action) => {
        state.jsonImportLoading = false;
        const createdItems = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];

        createdItems.forEach((item) => upsertProblemInList(state, item));
        state.jsonImportSummary = action.payload?.summary || null;
      })
      .addCase(importAdminProblemsFromJsonBulk.rejected, (state, action) => {
        state.jsonImportLoading = false;
        state.jsonImportError = action.payload;
        state.jsonImportSummary = action.payload?.summary || null;
      })

      .addCase(previewAdminProblemPdfImport.pending, (state) => {
        state.pdfPreviewLoading = true;
        state.pdfPreviewError = null;
        state.pdfImportSummary = null;
      })
      .addCase(previewAdminProblemPdfImport.fulfilled, (state, action) => {
        state.pdfPreviewLoading = false;
        state.pdfPreview = action.payload || null;
      })
      .addCase(previewAdminProblemPdfImport.rejected, (state, action) => {
        state.pdfPreviewLoading = false;
        state.pdfPreview = null;
        state.pdfPreviewError = action.payload;
      })

      .addCase(saveAdminProblemPdfImport.pending, (state) => {
        state.pdfSaveLoading = true;
        state.pdfSaveError = null;
      })
      .addCase(saveAdminProblemPdfImport.fulfilled, (state, action) => {
        state.pdfSaveLoading = false;
        state.pdfPreview = null;
        const createdItems = Array.isArray(action.payload?.data?.created)
          ? action.payload.data.created
          : [];
        createdItems.forEach((item) => upsertProblemInList(state, item));
        state.pdfImportSummary = action.payload?.data?.summary || null;
      })
      .addCase(saveAdminProblemPdfImport.rejected, (state, action) => {
        state.pdfSaveLoading = false;
        state.pdfSaveError = action.payload;
        state.pdfImportSummary = action.payload?.data?.summary || null;
      })

      .addCase(updateProblemFromJson.pending, (state) => {
        state.jsonImportLoading = true;
        state.jsonImportError = null;
      })
      .addCase(updateProblemFromJson.fulfilled, (state, action) => {
        state.jsonImportLoading = false;
        state.selectedProblem = action.payload || null;
        upsertProblemInList(state, action.payload);
      })
      .addCase(updateProblemFromJson.rejected, (state, action) => {
        state.jsonImportLoading = false;
        state.jsonImportError = action.payload;
      })

      .addCase(updateAdminProblem.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(updateAdminProblem.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedProblem = action.payload || null;
        upsertProblemInList(state, action.payload);
      })
      .addCase(updateAdminProblem.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })

      .addCase(deleteAdminProblem.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.actionError = null;
      })
      .addCase(deleteAdminProblem.fulfilled, (state, action) => {
        state.deletingId = null;
        const deletedId = action.payload?._id;
        state.problems = state.problems.filter(
          (problem) => problem._id !== String(deletedId),
        );
        if (state.selectedProblem?._id === String(deletedId)) {
          state.selectedProblem = null;
        }
      })
      .addCase(deleteAdminProblem.rejected, (state, action) => {
        state.deletingId = null;
        state.actionError = action.payload;
      })

      .addCase(toggleAdminProblemStatus.pending, (state, action) => {
        state.togglingId = action.meta.arg?.problemId || null;
        state.actionError = null;
      })
      .addCase(toggleAdminProblemStatus.fulfilled, (state, action) => {
        state.togglingId = null;
        upsertProblemInList(state, action.payload);
        if (state.selectedProblem?._id === action.payload?._id) {
          state.selectedProblem = { ...state.selectedProblem, ...action.payload };
        }
      })
      .addCase(toggleAdminProblemStatus.rejected, (state, action) => {
        state.togglingId = null;
        state.actionError = action.payload;
      });
  },
});

export const {
  setAdminProblemFilters,
  setAdminProblemPage,
  setAdminProblemLimit,
  clearSelectedAdminProblem,
  clearAdminProblemErrors,
  clearProblemPdfPreview,
} = adminProblemSlice.actions;

export default adminProblemSlice.reducer;
