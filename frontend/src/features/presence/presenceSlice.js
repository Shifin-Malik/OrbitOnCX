import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getActiveUsersCountAPI, sendHeartbeatAPI } from "../api.js";

export const fetchActiveUsersCount = createAsyncThunk(
  "presence/fetchActiveUsersCount",
  async (_, thunkAPI) => {
    try {
      const res = await getActiveUsersCountAPI();
      return res.data?.activeUsers ?? 0;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to load active users",
      );
    }
  },
);

export const sendHeartbeat = createAsyncThunk(
  "presence/sendHeartbeat",
  async (_, thunkAPI) => {
    try {
      await sendHeartbeatAPI();
      return true;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Heartbeat failed",
      );
    }
  },
);

const initialState = {
  activeUsers: null,
  loading: false,
  heartbeatLoading: false,
  error: null,
  lastUpdatedAt: null,
};

const presenceSlice = createSlice({
  name: "presence",
  initialState,
  reducers: {
    setActiveUsers: (state, action) => {
      state.activeUsers =
        typeof action.payload === "number" ? action.payload : state.activeUsers;
      state.lastUpdatedAt = new Date().toISOString();
    },
    resetPresence: (state) => {
      state.activeUsers = null;
      state.loading = false;
      state.heartbeatLoading = false;
      state.error = null;
      state.lastUpdatedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveUsersCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveUsersCount.fulfilled, (state, action) => {
        state.loading = false;
        state.activeUsers = action.payload;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(fetchActiveUsersCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load active users";
      })
      .addCase(sendHeartbeat.pending, (state) => {
        state.heartbeatLoading = true;
      })
      .addCase(sendHeartbeat.fulfilled, (state) => {
        state.heartbeatLoading = false;
      })
      .addCase(sendHeartbeat.rejected, (state) => {
        state.heartbeatLoading = false;
      });
  },
});

export const { setActiveUsers, resetPresence } = presenceSlice.actions;
export default presenceSlice.reducer;

