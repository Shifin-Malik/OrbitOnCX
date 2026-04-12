import API from "../../services/axios.js";

// Users (Admin)
export const getUsersAPI = (params) => API.get("/admin/users", { params });
export const getUserDetailsAPI = (userId) => API.get(`/admin/users/${userId}`);
export const blockUserAPI = (userId) =>
  API.patch(`/admin/users/${userId}/block`);
export const unblockUserAPI = (userId) =>
  API.patch(`/admin/users/${userId}/unblock`);
export const updateUserRoleAPI = (userId, role) =>
  API.patch(`/admin/users/${userId}/role`, { role });
export const softDeleteUserAPI = (userId) =>
  API.patch(`/admin/users/${userId}/soft-delete`);

// Backward-compat name used by existing UI
export const getAllUsersAPI = (params) => getUsersAPI(params);

export const getDashboardStatsAPI = () => API.get("/admin/dashboard/stats");
