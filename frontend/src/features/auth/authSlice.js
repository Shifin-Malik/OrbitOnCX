import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authAPI from "../api.js";
import { persistReducer } from "redux-persist";
import { CookieStorage } from "redux-persist-cookie-storage";
import Cookies from "js-cookie";

const initialState = {
  user: null,
  searchResults: [],
  loading: false,
  isError: false,
  isSuccess: false,
  message: "",
  selectedUser: null,
};

export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      const response = await authAPI.registerUser(userData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Registration failed",
      );
    }
  },
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (otpData, thunkAPI) => {
    try {
      const response = await authAPI.verifyEmail(otpData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "OTP verification failed",
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const response = await authAPI.loginUser(credentials);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Invalid credentials",
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, thunkAPI) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to initiate reset",
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (resetData, thunkAPI) => {
    try {
      const response = await authAPI.resetPassword(resetData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Password reset failed",
      );
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    await authAPI.logoutUser();
    return null;
  } catch (error) {
    return thunkAPI.rejectWithValue("Logout failed");
  }
});

export const toggleFollowAsync = createAsyncThunk(
  "auth/toggleFollow",
  async (targetUserId, thunkAPI) => {
    try {
      const response = await authAPI.toggleFollowAPI(targetUserId);
      return { targetUserId, data: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Action failed",
      );
    }
  },
);

export const getUserProfileByIdAsync = createAsyncThunk(
  "auth/getUserProfileById",
  async (userId, thunkAPI) => {
    try {
      const response = await authAPI.getUserByIdAPI(userId);
      return response.data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch user profile",
      );
    }
  },
);

export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.getUserData();
      return response.data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue("Session expired");
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, thunkAPI) => {
    try {
      const response = await authAPI.editUserData(formData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Update failed",
      );
    }
  },
);

export const searchUsersAsync = createAsyncThunk(
  "auth/searchUsers",
  async (query, thunkAPI) => {
    try {
      const response = await authAPI.searchUser(query);
      return response.data.users;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Search failed",
      );
    }
  },
);

export const googleLoginAction = createAsyncThunk(
  "auth/googleLogin",
  async (accessToken, thunkAPI) => {
    try {
      const response = await authAPI.googleAuth(accessToken);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Google authentication failed",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.loading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    resetSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(register.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.message = payload?.message || "Registration successful";
      })
      .addCase(verifyEmail.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.user = payload?.user;
        state.message = payload?.message;
        localStorage.setItem("isLoggedIn", "true");
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.user = payload?.user;
        state.message = payload?.message || "Authenticated successfully";
        localStorage.setItem("isLoggedIn", "true");
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
        localStorage.removeItem("isLoggedIn");
      })
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload;
        state.isError = false;
        localStorage.setItem("isLoggedIn", "true");
      })
      .addCase(getProfile.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isError = false;
        localStorage.removeItem("isLoggedIn");
      })
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.user = payload?.user;
        state.message = payload?.message;
      })
      .addCase(googleLoginAction.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.user = payload?.user;
        state.message = payload?.message || "Google login successful";
        localStorage.setItem("isLoggedIn", "true");
      })

      .addCase(getUserProfileByIdAsync.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.selectedUser = payload;
      })
      .addCase(getUserProfileByIdAsync.pending, (state) => {
        state.loading = true;
        state.selectedUser = null;
      })
      .addCase(getUserProfileByIdAsync.rejected, (state) => {
        state.loading = false;
        state.selectedUser = null;
      })

      .addCase(searchUsersAsync.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(searchUsersAsync.rejected, (state) => {
        state.searchResults = [];
      })

      .addCase(toggleFollowAsync.fulfilled, (state, action) => {
        const { targetUserId, data } = action.payload;

        // 1. Search Result Sync
        if (state.searchResults) {
          state.searchResults = state.searchResults.map((u) =>
            u._id.toString() === targetUserId.toString()
              ? { ...u, isFollowing: data.isFollowing }
              : u,
          );
        }

        if (state.user) {
          const following = state.user.following || [];
          const targetIdStr = targetUserId.toString();

          if (data.isFollowing) {
            const exists = following.some(
              (id) => id.toString() === targetIdStr,
            );
            if (!exists) {
              state.user.following = [...following, targetUserId];
            }
          } else {
            state.user.following = following.filter(
              (id) => id.toString() !== targetIdStr,
            );
          }
        }

        if (
          state.selectedUser &&
          state.selectedUser._id.toString() === targetUserId.toString()
        ) {
          state.selectedUser.isFollowing = data.isFollowing;

          if (state.selectedUser.stats) {
            const currentFollowers =
              state.selectedUser.stats.followerCount || 0;
            state.selectedUser.stats.followerCount = data.isFollowing
              ? currentFollowers + 1
              : Math.max(0, currentFollowers - 1);
          }
        }
      })
      .addMatcher(
        (action) =>
          [
            forgotPassword.fulfilled.type,
            resetPassword.fulfilled.type,
          ].includes(action.type),
        (state, { payload }) => {
          state.loading = false;
          state.isSuccess = true;
          state.message = payload?.message;
        },
      )

      .addMatcher(
        (action) =>
          action.type.startsWith("auth/") &&
          action.type.endsWith("/pending") &&
          !action.type.includes("getProfile") &&
          !action.type.includes("searchUsers") &&
          !action.type.includes("toggleFollow"),
        (state) => {
          state.loading = true;
          state.isError = false;
          state.isSuccess = false;
          state.message = "";
        },
      )

      .addMatcher(
        (action) =>
          action.type.startsWith("auth/") &&
          action.type.endsWith("/rejected") &&
          !action.type.includes("getProfile"),
        (state, { payload }) => {
          state.loading = false;
          state.isError = true;
          state.message = payload || "Something went wrong";
        },
      );
  },
});

const authPersistConfig = {
  key: "auth",
  storage: new CookieStorage(Cookies),
  blacklist: [
    "loading",
    "isError",
    "isSuccess",
    "message",
    "searchResults",
    "selectedUser",
  ],
};

export const { resetAuthState, clearSearchResults, resetSelectedUser } =
  authSlice.actions;

export default persistReducer(authPersistConfig, authSlice.reducer);
