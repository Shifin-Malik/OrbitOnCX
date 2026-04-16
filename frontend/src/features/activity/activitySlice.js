import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getActivityAPI, getStreakAPI, getProblemStatsAPI } from "../api.js";

export const fetchActivity = createAsyncThunk(
  "activity/fetchActivity",
  async (_, thunkAPI) => {
    try {
      const res = await getActivityAPI();
      const activity = res.data.activity || res.data.activities || [];
      const totalAcceptedSubmissions = Number(
        res.data.totalAcceptedSubmissions ??
          activity.reduce((sum, item) => sum + (Number(item?.count) || 0), 0),
      );
      const activeDays = Number(res.data.activeDays ?? activity.length);

      return {
        activity,
        totalAcceptedSubmissions,
        activeDays,
      };
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to load activity",
      );
    }
  },
);

export const fetchStreak = createAsyncThunk(
  "activity/fetchStreak",
  async (_, thunkAPI) => {
    try {
      const res = await getStreakAPI();
      return res.data.streak || null;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to load streak",
      );
    }
  },
);

export const fetchProblemStats = createAsyncThunk(
  "activity/fetchProblemStats",
  async (_, thunkAPI) => {
    try {
      const res = await getProblemStatsAPI();
      return res.data.stats || null;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to load stats",
      );
    }
  },
);

const initialState = {
  activities: [],
  totalAcceptedSubmissions: 0,
  activeDays: 0,
  streak: null,
  stats: null,
  loading: false,
  error: null,
};

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload.activity || [];
        state.totalAcceptedSubmissions =
          action.payload.totalAcceptedSubmissions || 0;
        state.activeDays = action.payload.activeDays || 0;
      })
      .addCase(fetchActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load activity";
      })

      .addCase(fetchStreak.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStreak.fulfilled, (state, action) => {
        state.loading = false;
        state.streak = action.payload;
      })
      .addCase(fetchStreak.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load streak";
      })

      .addCase(fetchProblemStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProblemStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchProblemStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load stats";
      });
  },
});

export default activitySlice.reducer;
