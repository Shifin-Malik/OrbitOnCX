import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as quizApi from "./quizzApi.js";

const handleReject = (error, rejectWithValue) => {
  const errorMessage =
    error.response?.data?.message || error.message || "Something went wrong";
  return rejectWithValue(errorMessage);
};

export const fetchAllQuizzes = createAsyncThunk(
  "quiz/fetchAllQuizzes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await quizApi.fetchAllQuizzes();
      return response.data;
    } catch (error) {
      return handleReject(error, rejectWithValue);
    }
  },
);

// Backwards compat with existing imports
export const fetchActiveQuizzes = fetchAllQuizzes;

export const fetchQuizDetails = createAsyncThunk(
  "quiz/fetchQuizDetails",
  async (quizId, { rejectWithValue }) => {
    try {
      const response = await quizApi.getQuizDetails(quizId);
      return response.data;
    } catch (error) {
      return handleReject(error, rejectWithValue);
    }
  },
);

export const startQuiz = createAsyncThunk(
  "quiz/startQuiz",
  async (
    { quizId, difficulty = "Mixed", limit, customTimeLimit },
    { rejectWithValue },
  ) => {
    try {
      const params = {
        difficulty,
        ...(limit ? { limit } : {}),
        ...(customTimeLimit ? { customTimeLimit } : {}),
      };
      const response = await quizApi.startQuiz(quizId, params);
      return response.data;
    } catch (error) {
      return handleReject(error, rejectWithValue);
    }
  },
);

// Backwards compat with existing imports
export const launchArena = startQuiz;

export const submitQuiz = createAsyncThunk(
  "quiz/submitQuiz",
  async (submissionData, { rejectWithValue }) => {
    try {
      const response = await quizApi.submitQuizResult(submissionData);
      return response.data;
    } catch (error) {
      return handleReject(error, rejectWithValue);
    }
  },
);

export const fetchUserHistory = createAsyncThunk(
  "quiz/fetchUserHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await quizApi.fetchUserHistory();
      return response.data;
    } catch (error) {
      return handleReject(error, rejectWithValue);
    }
  },
);

export const fetchLeaderboard = createAsyncThunk(
  "quiz/fetchLeaderboard",
  async (quizId, { rejectWithValue }) => {
    try {
      const response = await quizApi.fetchLeaderboard(quizId);
      return response.data;
    } catch (error) {
      return handleReject(error, rejectWithValue);
    }
  },
);

// Existing admin/config use-case
export const updateDifficulty = createAsyncThunk(
  "quiz/updateDifficulty",
  async ({ id, difficulty }, { rejectWithValue }) => {
    try {
      const response = await quizApi.updateQuizDifficulty(id, difficulty);
      return response.data;
    } catch (error) {
      return handleReject(error, rejectWithValue);
    }
  },
);

const initialState = {
  quizzes: [],
  quizDetails: null,

  activeBattle: null, // startQuiz payload + { questions }
  results: null,
  finalResult: null,
  history: [],
  leaderboard: [],

  loadingQuizzes: false,
  loadingDetails: false,
  startingBattle: false,
  submitting: false,
  loadingHistory: false,
  loadingLeaderboard: false,
  updateLoading: false,

  error: null,
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    clearBattle: (state) => {
      state.activeBattle = null;
      state.results = null;
      state.finalResult = null;
      state.error = null;
      state.startingBattle = false;
      state.submitting = false;
    },
    clearResults: (state) => {
      state.results = null;
      state.finalResult = null;
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllQuizzes.pending, (state) => {
        state.loadingQuizzes = true;
        state.error = null;
      })
      .addCase(fetchAllQuizzes.fulfilled, (state, action) => {
        state.loadingQuizzes = false;
        state.quizzes = action.payload.data || action.payload;
      })
      .addCase(fetchAllQuizzes.rejected, (state, action) => {
        state.loadingQuizzes = false;
        state.error = action.payload;
      })

      .addCase(fetchQuizDetails.pending, (state) => {
        state.loadingDetails = true;
        state.error = null;
      })
      .addCase(fetchQuizDetails.fulfilled, (state, action) => {
        state.loadingDetails = false;
        state.quizDetails = action.payload.data || action.payload;
      })
      .addCase(fetchQuizDetails.rejected, (state, action) => {
        state.loadingDetails = false;
        state.error = action.payload;
      })

      .addCase(startQuiz.pending, (state) => {
        state.startingBattle = true;
        state.activeBattle = null;
        state.results = null;
        state.error = null;
      })
      .addCase(startQuiz.fulfilled, (state, action) => {
        state.startingBattle = false;
        const payload = action.payload;
        state.activeBattle = {
          ...payload,
          questions: payload.data || [],
        };
      })
      .addCase(startQuiz.rejected, (state, action) => {
        state.startingBattle = false;
        state.error = action.payload;
      })

      .addCase(submitQuiz.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.submitting = false;
        state.results = action.payload.results || action.payload.data || action.payload;
        state.finalResult = state.results;
        if (state.activeBattle) state.activeBattle.questions = [];
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      .addCase(fetchUserHistory.pending, (state) => {
        state.loadingHistory = true;
        state.error = null;
      })
      .addCase(fetchUserHistory.fulfilled, (state, action) => {
        state.loadingHistory = false;
        state.history = action.payload.data || action.payload;
      })
      .addCase(fetchUserHistory.rejected, (state, action) => {
        state.loadingHistory = false;
        state.error = action.payload;
      })

      .addCase(fetchLeaderboard.pending, (state) => {
        state.loadingLeaderboard = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loadingLeaderboard = false;
        state.leaderboard = action.payload.data || action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loadingLeaderboard = false;
        state.error = action.payload;
      })

      .addCase(updateDifficulty.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateDifficulty.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updatedQuiz = action.payload.data || action.payload;

        state.quizzes = state.quizzes.map((quiz) =>
          quiz._id === updatedQuiz._id
            ? { ...quiz, difficulty: updatedQuiz.difficulty }
            : quiz,
        );

        if (state.quizDetails && state.quizDetails._id === updatedQuiz._id) {
          state.quizDetails = {
            ...state.quizDetails,
            difficulty: updatedQuiz.difficulty,
          };
        }
      })
      .addCase(updateDifficulty.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBattle, clearResults, resetError } = quizSlice.actions;
export default quizSlice.reducer;
