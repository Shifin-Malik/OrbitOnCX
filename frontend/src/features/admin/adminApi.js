import API from "../../services/axios.js";

export const getAllUsersAPI = () => API.get("/admin/all-users");