import API from "../../services/axios.js";

export const getAdminProblemsAPI = (params) =>
  API.get("/admin/problems", { params });

export const getProblemByIdAPI = (problemId) =>
  API.get(`/admin/problems/${problemId}`);

export const createProblemAPI = (payload) =>
  API.post("/admin/problems", payload);

export const createProblemFromJsonAPI = (payload) =>
  API.post("/admin/problems/json", payload);

export const bulkCreateProblemsFromJsonAPI = (payload) =>
  API.post("/admin/problems/json/bulk", payload);

export const updateProblemFromJsonAPI = (problemId, payload) =>
  API.put(`/admin/problems/${problemId}/json`, payload);

export const updateProblemAPI = (problemId, payload) =>
  API.put(`/admin/problems/${problemId}`, payload);

export const deleteProblemAPI = (problemId) =>
  API.delete(`/admin/problems/${problemId}`);

export const toggleProblemStatusAPI = (problemId, isActive) =>
  API.patch(`/admin/problems/${problemId}/status`, { isActive });
