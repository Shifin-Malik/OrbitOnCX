import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllUsersAPI } from "./adminApi.js";

export const getAllUsers = createAsyncThunk(
  "admin/getAllUsers",
  async (_, thunkAPI) => {
    try {
      const { data } = await getAllUsersAPI();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

const initialState = {
  users: [],
  loading: false,
  error: null,
  count: 0,
  success: false,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.users = action.payload.users || action.payload;
        state.count = action.payload.count || action.payload.length || 0;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export default adminSlice.reducer;