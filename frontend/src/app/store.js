import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { CookieStorage } from "redux-persist-cookie-storage";
import Cookies from "js-cookie";

import authReducer from "../features/auth/authSlice.js";
import compilerReducer from "../features/compiler/compilerSlice.js";
import adminReducer from "../features/admin/adminSlice.js";
import quizReducer from "../features/quizz/quizzSlice.js";
import problemReducer from "../features/problems/problemSlice.js";
import submissionReducer from "../features/submissions/submissionSlice.js";
import discussionReducer from "../features/discussions/discussionSlice.js";
import activityReducer from "../features/activity/activitySlice.js";

const rootReducer = combineReducers({
  auth: authReducer,
  compiler: compilerReducer,
  admin: adminReducer,
  quiz: quizReducer,
  problems: problemReducer,
  submissions: submissionReducer,
  discussions: discussionReducer,
  activity: activityReducer,
});

const persistConfig = {
  key: "orbiton_root",
  version: 1,
  storage: new CookieStorage(Cookies),
  blacklist: [
    "auth",
    "compiler",
    "admin",
    "quiz",
    "problems",
    "submissions",
    "discussions",
    "activity",
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
