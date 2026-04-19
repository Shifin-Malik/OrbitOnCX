import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { executeCodeAPI, saveDraftAPI, getDraftAPI } from "../api.js";

export const runCodeAction = createAsyncThunk(
  "compiler/run",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await executeCodeAPI(payload);

      if (response?.data?.success) {
        return {
          output:
            response.data.output ??
            response.data.result?.stdout ??
            response.data.result?.compile_output ??
            "No output",
        };
      }

      return rejectWithValue(
        response?.data?.message || "Execution failed",
      );
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Network error",
      );
    }
  },
);

export const loadDraftAction = createAsyncThunk(
  "compiler/loadDraft",
  async ({ userId, language }, { rejectWithValue }) => {
    try {
      const response = await getDraftAPI(userId, language);

      if (response?.data?.success) {
        return {
          code:
            typeof response.data.code === "string" ? response.data.code : "",
        };
      }

      return rejectWithValue(
        response?.data?.message || "Failed to load draft",
      );
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Network error",
      );
    }
  },
);

export const saveDraftAction = createAsyncThunk(
  "compiler/saveDraft",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await saveDraftAPI(payload);

      if (response?.data?.success) {
        return response.data.draft || null;
      }

      return rejectWithValue(
        response?.data?.message || "Failed to save draft",
      );
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Network error",
      );
    }
  },
);

const initialState = {
  code: "",
  output: "",
  compiling: false,
  savingDraft: false,
  loadingDraft: false,
  isInitialized: false,
  error: null,
  draftError: null,
};

const compilerSlice = createSlice({
  name: "compiler",
  initialState,
  reducers: {
    setCode: (state, action) => {
      state.code = typeof action.payload === "string" ? action.payload : "";
    },

    clearOutput: (state) => {
      state.output = "";
      state.error = null;
      state.compiling = false;
    },

    resetCompilerState: (state) => {
      state.code = "";
      state.output = "";
      state.compiling = false;
      state.savingDraft = false;
      state.loadingDraft = false;
      state.isInitialized = false;
      state.error = null;
      state.draftError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runCodeAction.pending, (state) => {
        state.compiling = true;
        state.error = null;
        state.output = "";
      })
      .addCase(runCodeAction.fulfilled, (state, action) => {
        state.compiling = false;
        state.output = action.payload?.output || "No output";
        state.error = null;
      })
      .addCase(runCodeAction.rejected, (state, action) => {
        state.compiling = false;
        state.output = "";
        state.error = action.payload || "Execution failed";
      })

      .addCase(loadDraftAction.pending, (state) => {
        state.loadingDraft = true;
        state.isInitialized = false;
        state.draftError = null;
      })
      .addCase(loadDraftAction.fulfilled, (state, action) => {
        state.loadingDraft = false;
        state.isInitialized = true;
        state.draftError = null;

        if (typeof action.payload?.code === "string") {
          state.code = action.payload.code;
        }
      })
      .addCase(loadDraftAction.rejected, (state, action) => {
        state.loadingDraft = false;
        state.isInitialized = true;
        state.draftError = action.payload || "Failed to load draft";
      })

      .addCase(saveDraftAction.pending, (state) => {
        state.savingDraft = true;
        state.draftError = null;
      })
      .addCase(saveDraftAction.fulfilled, (state) => {
        state.savingDraft = false;
        state.draftError = null;
      })
      .addCase(saveDraftAction.rejected, (state, action) => {
        state.savingDraft = false;
        state.draftError = action.payload || "Failed to save draft";
      });
  },
});

export const { clearOutput, setCode, resetCompilerState } =
  compilerSlice.actions;

export default compilerSlice.reducer;