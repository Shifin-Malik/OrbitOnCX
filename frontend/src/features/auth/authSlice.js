import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authAPI from "../api.js";
import { persistReducer } from "redux-persist";
import { CookieStorage } from "redux-persist-cookie-storage";
import Cookies from "js-cookie";

const initialState = {
  user: null,
  loading: false,
  isError: false,
  isSuccess: false,
  message: "",
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
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(register.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.message = payload?.message || "Registration successful";
      })
      // Verify Email
      .addCase(verifyEmail.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.user = payload?.user;
        state.message = payload?.message;
        localStorage.setItem("isLoggedIn", "true");
      })
      // Login
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.user = payload?.user;
        state.message = payload?.message || "Authenticated successfully";
        localStorage.setItem("isLoggedIn", "true");
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
        localStorage.removeItem("isLoggedIn");
      })
      // Get Profile
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
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.user = payload?.user;
        state.message = payload?.message;
      })
      // Google Login
      .addCase(googleLoginAction.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isSuccess = true;
        state.user = payload?.user;
        state.message = payload?.message || "Google login successful";
        localStorage.setItem("isLoggedIn", "true");
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
          !action.type.includes("getProfile"),
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
  blacklist: ["loading", "isError", "isSuccess", "message"],
};

export const { resetAuthState } = authSlice.actions;

export default persistReducer(authPersistConfig, authSlice.reducer);
