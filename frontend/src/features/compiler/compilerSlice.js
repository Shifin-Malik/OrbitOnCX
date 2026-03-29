import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { executeCodeAPI, saveDraftAPI, getDraftAPI } from "../api.js";


export const runCodeAction = createAsyncThunk(
  "compiler/run",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await executeCodeAPI(payload);
      if (response.data && response.data.success) {
        return response.data.output || "No output";
      }
      return rejectWithValue(response.data?.message || "Execution failed");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Network error",
      );
    }
  },
);


export const loadDraftAction = createAsyncThunk(
  "compiler/loadDraft",
  async ({ userId, language }, { rejectWithValue }) => {
    try {
      const response = await getDraftAPI(userId, language);
      if (response.data && response.data.success) {
        return response.data.code !== undefined ? response.data.code : null;
      }
      return rejectWithValue(response.data?.message || "Failed to load draft");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Network error",
      );
    }
  },
);


export const saveDraftAction = createAsyncThunk(
  "compiler/saveDraft",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await saveDraftAPI(payload);
      if (response.data && response.data.success) {
        return response.data.draft;
      }
      return rejectWithValue(response.data?.message || "Failed to save draft");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Network error",
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
      state.code = action.payload;
    },
    clearOutput: (state) => {
      state.output = "";
      state.error = null;
      state.compiling = false;
    },
    
      resetCompilerState: (state) => {
        state.code = "";
        state.isInitialized = false;
        state.output = "";
        state.error = null;
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
        state.output = action.payload;
      })
      .addCase(runCodeAction.rejected, (state, action) => {
        state.compiling = false;
        state.error = action.payload;
      })

      .addCase(loadDraftAction.pending, (state) => {
        state.loadingDraft = true;
        state.isInitialized = false; 
      })
      .addCase(loadDraftAction.fulfilled, (state, action) => {
        state.loadingDraft = false;
        state.isInitialized = true;
        if (action.payload !== null) {
          state.code = action.payload;
        }
      })
      .addCase(loadDraftAction.rejected, (state, action) => {
        state.loadingDraft = false;
        state.isInitialized = true; 
        state.draftError = action.payload;
      })


      .addCase(saveDraftAction.pending, (state) => {
        state.savingDraft = true;
      })
      .addCase(saveDraftAction.fulfilled, (state) => {
        state.savingDraft = false;
      })
      .addCase(saveDraftAction.rejected, (state, action) => {
        state.savingDraft = false;
        state.draftError = action.payload;
      });
  },
});

export const { clearOutput, setCode, resetCompilerState } =
  compilerSlice.actions;
export default compilerSlice.reducer;
