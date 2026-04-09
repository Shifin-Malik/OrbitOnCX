import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getProblemsAPI, getProblemBySlugAPI } from "../api.js";

export const fetchProblems = createAsyncThunk(
  "problems/fetchProblems",
  async (params, thunkAPI) => {
    try {
      const res = await getProblemsAPI(params);
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to load problems",
      );
    }
  },
);

export const fetchProblemBySlug = createAsyncThunk(
  "problems/fetchProblemBySlug",
  async (slug, thunkAPI) => {
    try {
      const res = await getProblemBySlugAPI(slug);
      return res.data.problem;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to load problem",
      );
    }
  },
);

const initialState = {
  list: [],
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  loadingList: false,
  listError: null,

  activeProblem: null,
  loadingProblem: false,
  problemError: null,
};

const problemSlice = createSlice({
  name: "problems",
  initialState,
  reducers: {
    clearActiveProblem: (state) => {
      state.activeProblem = null;
      state.problemError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProblems.pending, (state) => {
        state.loadingList = true;
        state.listError = null;
      })
      .addCase(fetchProblems.fulfilled, (state, { payload }) => {
        state.loadingList = false;
        state.list = payload?.problems || [];
        state.page = payload?.page || 1;
        state.limit = payload?.limit || 20;
        state.total = payload?.total || 0;
        state.totalPages = payload?.totalPages || 1;
      })
      .addCase(fetchProblems.rejected, (state, { payload }) => {
        state.loadingList = false;
        state.listError = payload || "Failed to load problems";
      })
      .addCase(fetchProblemBySlug.pending, (state) => {
        state.loadingProblem = true;
        state.problemError = null;
      })
      .addCase(fetchProblemBySlug.fulfilled, (state, { payload }) => {
        state.loadingProblem = false;
        state.activeProblem = payload;
      })
      .addCase(fetchProblemBySlug.rejected, (state, { payload }) => {
        state.loadingProblem = false;
        state.problemError = payload || "Failed to load problem";
      });
  },
});

export const { clearActiveProblem } = problemSlice.actions;
export default problemSlice.reducer;

