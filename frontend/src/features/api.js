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

export const googleAuth = (accessToken) =>
  API.post("/users/google", { access_token: accessToken });

export const executeCodeAPI = (data) => API.post("/users/execute", data);
