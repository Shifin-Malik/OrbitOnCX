import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 Error വന്നാൽ മാത്രം ഇത് പ്രവർത്തിക്കും
    if (error.response?.status === 401 && !originalRequest._retry) {
      // refresh-token എന്ന URL തന്നെയാണ് 401 അടിക്കുന്നതെങ്കിൽ ലൂപ്പ് ഒഴിവാക്കാൻ പുറത്ത് വിടണം
      if (originalRequest.url.includes("refresh-token")) {
        localStorage.removeItem("isLoggedIn");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          "http://localhost:5000/api/users/refresh-token",
          {},
          { withCredentials: true },
        );
        isRefreshing = false;
        processQueue(null);
        return API(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        // റിഫ്രഷ് ടോക്കൺ പരാജയപ്പെട്ടാൽ ലോക്കൽ സ്റ്റോറേജ് ക്ലിയർ ചെയ്യുക
        localStorage.removeItem("isLoggedIn");

        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default API;
