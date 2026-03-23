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
import authReducer from "../features/auth/authSlice.js"; // ഇത് ഓൾറെഡി പെഴ്സിസ്റ്റ് ചെയ്തതാണ്
import compiler from '../features/compiler/compilerSlice.js';

/**
 * @description Root Reducer combining all slices
 */
const rootReducer = combineReducers({
  auth: authReducer, // authSlice-ൽ നമ്മൾ ചെയ്ത blacklist ഇവിടെ വർക്ക് ചെയ്യും
  compiler: compiler
});

/**
 * @description Main Redux Persist Configuration
 */
const persistConfig = {
  key: "orbiton_root",
  version: 1,
  storage: new CookieStorage(Cookies),
  // പ്രധാനപ്പെട്ട മാറ്റം:
  // auth സ്ലൈസ് നമ്മൾ authSlice.js-ൽ തന്നെ പെഴ്സിസ്റ്റ് ചെയ്തതുകൊണ്ട്
  // ഇവിടെ വീണ്ടും whitelist ചെയ്യേണ്ടതില്ല. 
  // വേണമെങ്കിൽ 'compiler' മാത്രം ഇവിടെ പെഴ്സിസ്റ്റ് ചെയ്യാം.
  blacklist: ["auth"], 
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