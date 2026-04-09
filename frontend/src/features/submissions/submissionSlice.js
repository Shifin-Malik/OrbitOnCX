import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  runProblemAPI,
  submitProblemAPI,
  getProblemSubmissionsAPI,
  getProblemDraftAPI,
  saveProblemDraftAPI,
} from "../api.js";

export const runProblem = createAsyncThunk(
  "submissions/runProblem",
  async ({ slug, language, code }, thunkAPI) => {
    try {
      const res = await runProblemAPI(slug, { language, code });
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Run failed",
      );
    }
  },
);

export const submitProblem = createAsyncThunk(
  "submissions/submitProblem",
  async ({ slug, language, code }, thunkAPI) => {
    try {
      const res = await submitProblemAPI(slug, { language, code });
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Submit failed",
      );
    }
  },
);

export const fetchMySubmissions = createAsyncThunk(
  "submissions/fetchMySubmissions",
  async ({ slug, params }, thunkAPI) => {
    try {
      const res = await getProblemSubmissionsAPI(slug, params);
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to load submissions",
      );
    }
  },
);

export const fetchProblemDraft = createAsyncThunk(
  "submissions/fetchProblemDraft",
  async ({ slug, language }, thunkAPI) => {
    try {
      const res = await getProblemDraftAPI(slug, { language });
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to load draft",
      );
    }
  },
);

export const saveProblemDraft = createAsyncThunk(
  "submissions/saveProblemDraft",
  async ({ slug, language, code }, thunkAPI) => {
    try {
      const res = await saveProblemDraftAPI(slug, { language, code });
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to save draft",
      );
    }
  },
);

const initialState = {
  running: false,
  submitting: false,
  output: null, // run result
  submitResult: null,
  error: null,

  mySubmissions: [],
  submissionsLoading: false,
  submissionsError: null,

  draftLoading: false,
  draftSaving: false,
  draftError: null,
  draft: { code: "", hasDraft: false, starterCode: "" },
};

const submissionSlice = createSlice({
  name: "submissions",
  initialState,
  reducers: {
    clearRunOutput: (state) => {
      state.output = null;
      state.error = null;
    },
    clearSubmitResult: (state) => {
      state.submitResult = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runProblem.pending, (state) => {
        state.running = true;
        state.error = null;
        state.output = null;
      })
      .addCase(runProblem.fulfilled, (state, { payload }) => {
        state.running = false;
        state.output = payload;
      })
      .addCase(runProblem.rejected, (state, { payload }) => {
        state.running = false;
        state.error = payload || "Run failed";
      })
      .addCase(submitProblem.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.submitResult = null;
      })
      .addCase(submitProblem.fulfilled, (state, { payload }) => {
        state.submitting = false;
        state.submitResult = payload;
      })
      .addCase(submitProblem.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload || "Submit failed";
      })
      .addCase(fetchMySubmissions.pending, (state) => {
        state.submissionsLoading = true;
        state.submissionsError = null;
      })
      .addCase(fetchMySubmissions.fulfilled, (state, { payload }) => {
        state.submissionsLoading = false;
        state.mySubmissions = payload?.submissions || [];
      })
      .addCase(fetchMySubmissions.rejected, (state, { payload }) => {
        state.submissionsLoading = false;
        state.submissionsError = payload || "Failed to load submissions";
      })
      .addCase(fetchProblemDraft.pending, (state) => {
        state.draftLoading = true;
        state.draftError = null;
      })
      .addCase(fetchProblemDraft.fulfilled, (state, { payload }) => {
        state.draftLoading = false;
        state.draft = payload || { code: "", hasDraft: false, starterCode: "" };
      })
      .addCase(fetchProblemDraft.rejected, (state, { payload }) => {
        state.draftLoading = false;
        state.draftError = payload || "Failed to load draft";
      })
      .addCase(saveProblemDraft.pending, (state) => {
        state.draftSaving = true;
        state.draftError = null;
      })
      .addCase(saveProblemDraft.fulfilled, (state) => {
        state.draftSaving = false;
      })
      .addCase(saveProblemDraft.rejected, (state, { payload }) => {
        state.draftSaving = false;
        state.draftError = payload || "Failed to save draft";
      });
  },
});

export const { clearRunOutput, clearSubmitResult } = submissionSlice.actions;
export default submissionSlice.reducer;

