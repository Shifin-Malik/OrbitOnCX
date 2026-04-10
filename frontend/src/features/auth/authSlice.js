import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authAPI from "../api.js";
import { persistReducer } from "redux-persist";
import { CookieStorage } from "redux-persist-cookie-storage";
import Cookies from "js-cookie";

const initialState = {
  user: null,
  searchResults: [],
  recentSearches: [],
  recentSearchesLoading: false,
  recentSearchesError: null,
  followPendingByUserId: {},
  loading: false,
  isError: false,
  isSuccess: false,
  message: "",
  selectedUser: null,
};

const idToString = (value) => {
  if (!value) return "";
  const candidate = value?._id ?? value;
  return typeof candidate?.toString === "function" ? candidate.toString() : "";
};

const listHasId = (list, id) => {
  const idStr = idToString(id);
  return Array.isArray(list) && list.some((item) => idToString(item) === idStr);
};

const removeIdFromList = (list, id) => {
  const idStr = idToString(id);
  return Array.isArray(list)
    ? list.filter((item) => idToString(item) !== idStr)
    : [];
};

const getUserPreviewFromState = (state, userId) => {
  const idStr = idToString(userId);
  return (
    state.searchResults?.find((u) => idToString(u?._id) === idStr) ||
    state.recentSearches?.find((u) => idToString(u?._id) === idStr) ||
    (idToString(state.selectedUser?._id) === idStr ? state.selectedUser : null)
  );
};

const applyFollowTransition = (state, targetUserId, prev, next) => {
  const targetIdStr = idToString(targetUserId);
  if (!targetIdStr) return;

  // 1) Current user following list
  if (state.user) {
    const wasFollowing = listHasId(state.user.following, targetIdStr);

    if (next && !wasFollowing) {
      const preview = getUserPreviewFromState(state, targetIdStr);
      const entry = preview
        ? {
            _id: preview._id,
            name: preview.name,
            avatar: preview.avatar,
            profilePic: preview.profilePic,
          }
        : targetIdStr;

      state.user.following = [...(state.user.following || []), entry];
    }

    if (!next && wasFollowing) {
      state.user.following = removeIdFromList(state.user.following, targetIdStr);
    }
  }

  // 2) Search results + recent list item flags (if they exist)
  if (Array.isArray(state.searchResults)) {
    state.searchResults = state.searchResults.map((u) =>
      idToString(u?._id) === targetIdStr ? { ...u, isFollowing: next } : u,
    );
  }
  if (Array.isArray(state.recentSearches)) {
    state.recentSearches = state.recentSearches.map((u) =>
      idToString(u?._id) === targetIdStr ? { ...u, isFollowing: next } : u,
    );
  }

  // 3) Selected profile sync
  if (state.selectedUser && idToString(state.selectedUser._id) === targetIdStr) {
    state.selectedUser.isFollowing = next;

    if (state.selectedUser.stats?.followerCount != null && prev !== next) {
      state.selectedUser.stats.followerCount = next
        ? (state.selectedUser.stats.followerCount || 0) + 1
        : Math.max(0, (state.selectedUser.stats.followerCount || 0) - 1);
    }

    if (next && !listHasId(state.selectedUser.followers, state.user?._id)) {
      const currentUserData = state.user
        ? {
            _id: state.user._id,
            name: state.user.name,
            avatar: state.user.avatar,
            bio: state.user.bio,
          }
        : null;

      if (currentUserData) {
        state.selectedUser.followers = [
          ...(state.selectedUser.followers || []),
          currentUserData,
        ];
      }
    }

    if (!next) {
      state.selectedUser.followers = removeIdFromList(
        state.selectedUser.followers || [],
        state.user?._id,
      );
    }
  }
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
      return { targetUserId, ...response.data };
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

export const fetchRecentSearches = createAsyncThunk(
  "auth/fetchRecentSearches",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.getSearchHistoryAPI();
      return response.data.users || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load recent searches",
      );
    }
  },
);

export const saveRecentSearchUser = createAsyncThunk(
  "auth/saveRecentSearchUser",
  async (searchedUserId, thunkAPI) => {
    try {
      const response = await authAPI.addSearchHistoryAPI(searchedUserId);
      return response.data.users || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to save recent search",
      );
    }
  },
);

export const removeRecentSearchUser = createAsyncThunk(
  "auth/removeRecentSearchUser",
  async (searchedUserId, thunkAPI) => {
    try {
      const response = await authAPI.removeSearchHistoryAPI(searchedUserId);
      return response.data.users || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to remove recent search",
      );
    }
  },
);

export const clearRecentSearches = createAsyncThunk(
  "auth/clearRecentSearches",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.clearSearchHistoryAPI();
      return response.data.users || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to clear recent searches",
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
        const derivedIsFollowing = listHasId(state.user?.following, payload?._id);
        state.selectedUser = {
          ...payload,
          isFollowing: state.user ? derivedIsFollowing : !!payload?.isFollowing,
        };
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
        const following = state.user?.following || [];
        state.searchResults = (action.payload || []).map((u) => ({
          ...u,
          isFollowing: listHasId(following, u?._id),
        }));
      })
      .addCase(searchUsersAsync.rejected, (state) => {
        state.searchResults = [];
      })

      .addCase(fetchRecentSearches.pending, (state) => {
        state.recentSearchesLoading = true;
        state.recentSearchesError = null;
      })
      .addCase(fetchRecentSearches.fulfilled, (state, action) => {
        state.recentSearchesLoading = false;
        const following = state.user?.following || [];
        state.recentSearches = (action.payload || []).map((u) => ({
          ...u,
          isFollowing: listHasId(following, u?._id),
        }));
      })
      .addCase(fetchRecentSearches.rejected, (state, action) => {
        state.recentSearchesLoading = false;
        state.recentSearches = [];
        state.recentSearchesError =
          action.payload || "Failed to load recent searches";
      })

      .addCase(saveRecentSearchUser.fulfilled, (state, action) => {
        state.recentSearches = action.payload;
      })
      .addCase(saveRecentSearchUser.rejected, (state, action) => {
        state.recentSearchesError =
          action.payload || "Failed to save recent search";
      })

      .addCase(removeRecentSearchUser.fulfilled, (state, action) => {
        state.recentSearches = action.payload;
      })
      .addCase(removeRecentSearchUser.rejected, (state, action) => {
        state.recentSearchesError =
          action.payload || "Failed to remove recent search";
      })

      .addCase(clearRecentSearches.fulfilled, (state, action) => {
        state.recentSearches = action.payload;
      })
      .addCase(clearRecentSearches.rejected, (state, action) => {
        state.recentSearchesError =
          action.payload || "Failed to clear recent searches";
      })

      .addCase(toggleFollowAsync.pending, (state, action) => {
        const targetUserId = action.meta.arg;
        const targetIdStr = idToString(targetUserId);
        if (!targetIdStr) return;

        if (state.followPendingByUserId[targetIdStr]) return;

        const prevIsFollowing = listHasId(state.user?.following, targetIdStr);
        state.followPendingByUserId[targetIdStr] = { prevIsFollowing };

        // Optimistic UI update
        applyFollowTransition(
          state,
          targetIdStr,
          prevIsFollowing,
          !prevIsFollowing,
        );
      })
      .addCase(toggleFollowAsync.fulfilled, (state, action) => {
        const { targetUserId, isFollowing, targetFollowerCount } =
          action.payload || {};
        const targetIdStr = idToString(targetUserId);
        if (!targetIdStr) return;

        delete state.followPendingByUserId[targetIdStr];

        const currentIsFollowing = listHasId(state.user?.following, targetIdStr);
        if (currentIsFollowing !== !!isFollowing) {
          applyFollowTransition(
            state,
            targetIdStr,
            currentIsFollowing,
            !!isFollowing,
          );
        }

        if (
          state.selectedUser &&
          idToString(state.selectedUser._id) === targetIdStr &&
          typeof targetFollowerCount === "number"
        ) {
          state.selectedUser.stats = state.selectedUser.stats || {};
          state.selectedUser.stats.followerCount = targetFollowerCount;
        }
      })
      .addCase(toggleFollowAsync.rejected, (state, action) => {
        const targetIdStr = idToString(action.meta?.arg);
        if (!targetIdStr) return;

        const pending = state.followPendingByUserId[targetIdStr];
        delete state.followPendingByUserId[targetIdStr];

        if (!pending) return;

        const currentIsFollowing = listHasId(state.user?.following, targetIdStr);
        if (currentIsFollowing !== pending.prevIsFollowing) {
          applyFollowTransition(
            state,
            targetIdStr,
            currentIsFollowing,
            pending.prevIsFollowing,
          );
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
    "recentSearches",
    "recentSearchesLoading",
    "recentSearchesError",
    "followPendingByUserId",
    "selectedUser",
  ],
};

export const { resetAuthState, clearSearchResults, resetSelectedUser } =
  authSlice.actions;

export default persistReducer(authPersistConfig, authSlice.reducer);
