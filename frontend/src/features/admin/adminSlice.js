import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  blockUserAPI,
  getAllUsersAPI,
  getDashboardStatsAPI,
  getUserDetailsAPI,
  softDeleteUserAPI,
  unblockUserAPI,
  updateUserRoleAPI,
} from "./adminApi.js";

export const getAllUsers = createAsyncThunk(
  "admin/getAllUsers",
  async (params = {}, thunkAPI) => {
    try {
      const { data } = await getAllUsersAPI(params);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

export const getDashboardStats = createAsyncThunk(
  "admin/getDashboardStats",
  async (_, thunkAPI) => {
    try {
      const { data } = await getDashboardStatsAPI();
      return data?.stats;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard stats",
      );
    }
  },
);

export const getUserDetails = createAsyncThunk(
  "admin/getUserDetails",
  async (userId, thunkAPI) => {
    try {
      const { data } = await getUserDetailsAPI(userId);
      return data?.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch user details",
      );
    }
  },
);

export const blockUser = createAsyncThunk(
  "admin/blockUser",
  async (userId, thunkAPI) => {
    try {
      const { data } = await blockUserAPI(userId);
      return data?.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to block user",
      );
    }
  },
);

export const unblockUser = createAsyncThunk(
  "admin/unblockUser",
  async (userId, thunkAPI) => {
    try {
      const { data } = await unblockUserAPI(userId);
      return data?.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to unblock user",
      );
    }
  },
);

export const updateUserRole = createAsyncThunk(
  "admin/updateUserRole",
  async ({ userId, role }, thunkAPI) => {
    try {
      const { data } = await updateUserRoleAPI(userId, role);
      return data?.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update role",
      );
    }
  },
);

export const softDeleteUser = createAsyncThunk(
  "admin/softDeleteUser",
  async (userId, thunkAPI) => {
    try {
      const { data } = await softDeleteUserAPI(userId);
      return data?.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

const initialState = {
  users: [],
  loading: false,
  error: null,
  count: 0,
  success: false,
  pagination: {
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 1,
  },
  userDetails: null,
  userDetailsLoading: false,
  userDetailsError: null,
  userActionLoading: false,
  userActionError: null,
  dashboardStats: null,
  dashboardLoading: false,
  dashboardError: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    presenceBulkSync: (state, { payload }) => {
      const states = payload?.states || {};
      state.users = state.users.map((u) => {
        const s = states[String(u._id)];
        if (!s) return u;
        const isOnline = Boolean(s.isOnline);
        const status = u.isDeleted
          ? "Deleted"
          : u.isBlocked
            ? "Blocked"
            : isOnline
              ? "Online"
              : "Active";
        return { ...u, isOnline, status };
      });

      if (state.userDetails?._id) {
        const s = states[String(state.userDetails._id)];
        if (s) {
          const isOnline = Boolean(s.isOnline);
          const status = state.userDetails.isDeleted
            ? "Deleted"
            : state.userDetails.isBlocked
              ? "Blocked"
              : isOnline
                ? "Online"
                : "Active";
          state.userDetails = { ...state.userDetails, isOnline, status };
        }
      }
    },
    presenceUserOnline: (state, { payload }) => {
      const userId = payload?.userId;
      if (!userId) return;
      state.users = state.users.map((u) => {
        if (String(u._id) !== String(userId)) return u;
        if (u.isDeleted) return u;
        if (u.isBlocked) return { ...u, isOnline: false, status: "Blocked" };
        return { ...u, isOnline: true, status: "Online" };
      });
      if (state.userDetails?._id && String(state.userDetails._id) === String(userId)) {
        if (!state.userDetails.isDeleted && !state.userDetails.isBlocked) {
          state.userDetails = { ...state.userDetails, isOnline: true, status: "Online" };
        }
      }
    },
    presenceUserOffline: (state, { payload }) => {
      const userId = payload?.userId;
      const lastSeenAt = payload?.lastSeenAt;
      if (!userId) return;
      state.users = state.users.map((u) => {
        if (String(u._id) !== String(userId)) return u;
        if (u.isDeleted) return u;
        if (u.isBlocked) return { ...u, isOnline: false, status: "Blocked" };
        return {
          ...u,
          isOnline: false,
          status: "Active",
          lastSeenAt: lastSeenAt || u.lastSeenAt,
          lastLogin: lastSeenAt || u.lastLogin,
        };
      });
      if (state.userDetails?._id && String(state.userDetails._id) === String(userId)) {
        if (!state.userDetails.isDeleted && !state.userDetails.isBlocked) {
          state.userDetails = {
            ...state.userDetails,
            isOnline: false,
            status: "Active",
            lastSeenAt: lastSeenAt || state.userDetails.lastSeenAt,
            lastLogin: lastSeenAt || state.userDetails.lastLogin,
          };
        }
      }
    },
  },
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
        state.users = action.payload?.users || [];
        state.pagination = action.payload?.pagination || state.pagination;
        state.count = state.pagination?.totalUsers ?? state.users.length ?? 0;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })
      .addCase(getUserDetails.pending, (state) => {
        state.userDetailsLoading = true;
        state.userDetailsError = null;
        state.userDetails = null;
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.userDetailsLoading = false;
        state.userDetails = action.payload || null;
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.userDetailsLoading = false;
        state.userDetailsError = action.payload;
      })
      .addCase(blockUser.pending, (state) => {
        state.userActionLoading = true;
        state.userActionError = null;
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.userActionLoading = false;
        const updated = action.payload;
        if (updated?._id) {
          const idx = state.users.findIndex((u) => u._id === updated._id);
          if (idx >= 0) {
            state.users[idx] = { ...state.users[idx], ...updated };
          }
          if (state.userDetails?._id === updated._id) {
            state.userDetails = { ...state.userDetails, ...updated };
          }
        }
      })
      .addCase(blockUser.rejected, (state, action) => {
        state.userActionLoading = false;
        state.userActionError = action.payload;
      })
      .addCase(unblockUser.pending, (state) => {
        state.userActionLoading = true;
        state.userActionError = null;
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.userActionLoading = false;
        const updated = action.payload;
        if (updated?._id) {
          const idx = state.users.findIndex((u) => u._id === updated._id);
          if (idx >= 0) {
            state.users[idx] = { ...state.users[idx], ...updated };
          }
          if (state.userDetails?._id === updated._id) {
            state.userDetails = { ...state.userDetails, ...updated };
          }
        }
      })
      .addCase(unblockUser.rejected, (state, action) => {
        state.userActionLoading = false;
        state.userActionError = action.payload;
      })
      .addCase(updateUserRole.pending, (state) => {
        state.userActionLoading = true;
        state.userActionError = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.userActionLoading = false;
        const updated = action.payload;
        if (updated?._id) {
          const idx = state.users.findIndex((u) => u._id === updated._id);
          if (idx >= 0) {
            state.users[idx] = { ...state.users[idx], ...updated };
          }
          if (state.userDetails?._id === updated._id) {
            state.userDetails = { ...state.userDetails, ...updated };
          }
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.userActionLoading = false;
        state.userActionError = action.payload;
      })
      .addCase(softDeleteUser.pending, (state) => {
        state.userActionLoading = true;
        state.userActionError = null;
      })
      .addCase(softDeleteUser.fulfilled, (state, action) => {
        state.userActionLoading = false;
        const updated = action.payload;
        if (updated?._id) {
          const idx = state.users.findIndex((u) => u._id === updated._id);
          if (idx >= 0) {
            state.users[idx] = { ...state.users[idx], ...updated };
          }
          if (state.userDetails?._id === updated._id) {
            state.userDetails = { ...state.userDetails, ...updated };
          }
        }
      })
      .addCase(softDeleteUser.rejected, (state, action) => {
        state.userActionLoading = false;
        state.userActionError = action.payload;
      })
      .addCase(getDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardStats = action.payload || null;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload;
      });
  },
});

export const {
  presenceBulkSync,
  presenceUserOnline,
  presenceUserOffline,
} = adminSlice.actions;

export default adminSlice.reducer;
