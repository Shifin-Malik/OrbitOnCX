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

/**
 * @description Root Reducer combining all slices
 */
const rootReducer = combineReducers({
  auth: authReducer,
});

/**
 * @description Redux Persist Configuration using Cookies
 */
const persistConfig = {
  key: "orbiton_root",
  version: 1,
  // localStorage-ന് പകരം CookieStorage ഉപയോഗിക്കുന്നു
  storage: new CookieStorage(Cookies, {
    expiration: {
      default: 365 * 86400 // 1 വർഷം കാലാവധി (സെക്കൻഡിൽ)
    },
    setCookieOptions: {
      path: "/",
      secure: true, // HTTPS-ൽ മാത്രം വർക്ക് ചെയ്യാൻ
      sameSite: "strict"
    }
  }),
  whitelist: ["auth"], // auth സ്ലൈസ് മാത്രം കുക്കിയിൽ സേവ് ചെയ്യുക
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * @description Redux Store Configuration
 */
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