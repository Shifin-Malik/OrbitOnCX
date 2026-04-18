import API from "../../services/axios.js";

// 1. Get all active quizzes
export const fetchAllQuizzes = () => API.get("/users/quizzes");
export const getActiveQuizzes = fetchAllQuizzes;

// 2. Get specific quiz details
export const getQuizDetails = (id) => API.get(`/users/quizzes/${id}`);

// 3. Start quiz with dynamic distribution (Pass limit, difficulty, customTimeLimit in params)
export const startQuiz = (id, params) =>
  API.get(`/users/quizzes/start/${id}`, { params });
export const launchQuizArena = startQuiz;

// 4. Submit quiz result and calculate XP/Rank
export const submitQuizResult = (data) =>
  API.post("/users/quizzes/submit", data);

// 5. Fetch user quiz history
export const fetchUserHistory = (params) =>
  API.get("/users/quizzes/history", { params });

// 6. Fetch leaderboard for a quiz
export const fetchLeaderboard = (quizId) =>
  API.get("/users/quizzes/leaderboard", { params: quizId ? { quizId } : {} });



