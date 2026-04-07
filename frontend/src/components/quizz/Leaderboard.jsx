import React from "react";
import { useSelector } from "react-redux";

import LeaderboardUI from "./LeaderboardUI.jsx";

const Leaderboard = () => {
  const { activeBattle, quizDetails } = useSelector((state) => state.quiz);
  const quizId = activeBattle?.quizId || quizDetails?._id || null;
  const mode = quizId ? "QUIZ" : "GLOBAL";

  return <LeaderboardUI quizId={quizId} mode={mode} />;
};

export default Leaderboard;
