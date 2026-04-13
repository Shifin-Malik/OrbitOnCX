import API from "../services/axios.js";

export const registerUser = (data) => API.post("/users/register", data);

export const verifyEmail = (data) => API.post("/users/verify-email", data);

export const loginUser = (data) => API.post("/users/login", data);

export const forgotPassword = (data) =>
  API.post("/users/forgot-password", data);

export const resetPassword = (data) => API.post("/users/reset-password", data);

export const logoutUser = () => API.post("/users/logout");

export const getUserData = () => API.get("/users/profile");

export const editUserData = (formData) => {
  return API.put("/users/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const searchUser = (query) => {
  return API.get(`/users/search-users`, {
    params: { search: query },
  });
};

// --- Search History (Recent Searches) ---
export const getSearchHistoryAPI = () => API.get("/users/search-history");
export const addSearchHistoryAPI = (searchedUserId) =>
  API.post("/users/search-history", { searchedUserId });
export const removeSearchHistoryAPI = (searchedUserId) =>
  API.delete(`/users/search-history/${searchedUserId}`);
export const clearSearchHistoryAPI = () => API.delete("/users/search-history");

export const toggleFollowAPI = (userId) => API.put(`/users/follow/${userId}`);

export const getUserByIdAPI = (userId) => API.get(`/users/profile/${userId}`);

export const googleAuth = (accessToken) =>
  API.post("/users/google", { access_token: accessToken });

export const executeCodeAPI = (data) => API.post("/users/execute", data);

export const saveDraftAPI = (data) => API.post("/users/save-draft", data);

export const getDraftAPI = (userId, language) =>
  API.get("/users/get-draft", {
    params: { userId, language },
  });


export const getProblemsAPI = (params) => API.get("/problems", { params });
export const getProblemBySlugAPI = (slug) => API.get(`/problems/${slug}`);
export const runProblemAPI = (slug, data) => API.post(`/problems/${slug}/run`, data);
export const submitProblemAPI = (slug, data) =>
  API.post(`/problems/${slug}/submit`, data);
export const getProblemSubmissionsAPI = (slug, params) =>
  API.get(`/problems/${slug}/submissions`, { params });
export const getProblemDraftAPI = (slug, params) =>
  API.get(`/problems/${slug}/draft`, { params });
export const saveProblemDraftAPI = (slug, data) =>
  API.put(`/problems/${slug}/draft`, data);


export const getProblemDiscussionsAPI = (problemId) =>
  API.get(`/problems/${problemId}/discussions`);
export const postProblemDiscussionAPI = (problemId, data) =>
  API.post(`/problems/${problemId}/discussions`, data);
export const replyProblemDiscussionAPI = (problemId, commentId, data) =>
  API.post(`/problems/${problemId}/discussions/${commentId}/reply`, data);
export const deleteDiscussionAPI = (commentId) =>
  API.delete(`/discussions/${commentId}`);

// --- Profile / Activity ---
export const getProblemStatsAPI = () => API.get("/users/profile/problem-stats");
export const getActivityAPI = () => API.get("/users/profile/activity");
export const getStreakAPI = () => API.get("/users/profile/streak");

// --- Presence / Active Users ---
export const sendHeartbeatAPI = () => API.patch("/users/heartbeat");
export const getActiveUsersCountAPI = () => API.get("/users/active-count");
