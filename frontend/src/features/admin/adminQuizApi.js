import API from "../../services/axios.js";

export const fetchAdminQuizzesAPI = (params) =>
  API.get("/admin/quizzes", { params });

export const fetchAdminQuizByIdAPI = (quizId, params) =>
  API.get(`/admin/quizzes/${quizId}`, { params });

export const createAdminQuizAPI = (payload) =>
  API.post("/admin/quizzes", payload);

export const updateAdminQuizAPI = (quizId, payload) =>
  API.put(`/admin/quizzes/${quizId}`, payload);

export const deleteAdminQuizAPI = (quizId) =>
  API.delete(`/admin/quizzes/${quizId}`);

export const toggleAdminQuizStatusAPI = (quizId, isActive) =>
  API.patch(`/admin/quizzes/${quizId}/toggle-status`, { isActive });

export const parseAdminQuizPdfAPI = (formData) =>
  API.post("/admin/quizzes/parse-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const previewAdminQuizPdfAPI = parseAdminQuizPdfAPI;

export const commitAdminQuizPdfAPI = (payload) =>
  API.post("/admin/quizzes/import/pdf/commit", payload);

export const addAdminQuizQuestionAPI = (quizId, question) =>
  API.post(`/admin/quizzes/${quizId}/questions`, { question });

export const bulkAddAdminQuizQuestionsAPI = (quizId, questions) =>
  API.post(`/admin/quizzes/${quizId}/questions/bulk`, { questions });

export const updateAdminQuizQuestionAPI = (questionId, payload) =>
  API.put(`/admin/questions/${questionId}`, payload);

export const deleteAdminQuizQuestionAPI = (questionId) =>
  API.delete(`/admin/questions/${questionId}`);
