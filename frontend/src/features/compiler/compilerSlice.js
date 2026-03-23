import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { executeCodeAPI } from "../api.js";

/**
 * @description Async Thunk for executing code on the backend
 */
export const runCodeAction = createAsyncThunk(
  "compiler/run",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await executeCodeAPI(payload);
      
      // Backend-ൽ നിന്ന് ഡാറ്റ വരുന്നുണ്ടെന്ന് ഉറപ്പുവരുത്തുക
      if (response.data && response.data.success) {
        return response.data.output;
      } else {
        // success false ആണെങ്കിൽ എറർ റിട്ടേൺ ചെയ്യുക
        return rejectWithValue(response.data?.message || "Execution failed");
      }
    } catch (error) {
      // Axios error handling
      const message =
        error.response?.data?.message || 
        error.message || 
        "Network error: Execution failed";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  output: "",
  compiling: false, 
  error: null,
};

const compilerSlice = createSlice({
  name: "compiler",
  initialState,
  reducers: {
    // ഔട്ട്‌പുട്ട് ക്ലിയർ ചെയ്യാൻ (Manual trigger)
    clearOutput: (state) => {
      state.output = "";
      state.error = null;
      state.compiling = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Code Execution തുടങ്ങുമ്പോൾ
      .addCase(runCodeAction.pending, (state) => {
        state.compiling = true;
        state.error = null;
        state.output = ""; 
      })
      // സക്സസ് ആകുമ്പോൾ
      .addCase(runCodeAction.fulfilled, (state, action) => {
        state.compiling = false;
        state.output = action.payload; // Payload string ആണെന്ന് ഉറപ്പാക്കുക
        state.error = null;
      })
      // ഫെയിൽ ആകുമ്പോൾ
      .addCase(runCodeAction.rejected, (state, action) => {
        state.compiling = false;
        // payload ഉണ്ടെങ്കിൽ അത് എടുക്കുക, അല്ലെങ്കിൽ default error
        state.error = action.payload || "Something went wrong during execution";
      });
  },
});

export const { clearOutput } = compilerSlice.actions;
export default compilerSlice.reducer;