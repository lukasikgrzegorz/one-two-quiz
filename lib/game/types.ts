export type GameSessionStatus = "lobby" | "active" | "finished";
export type GamePhase = "question" | "answers" | "reveal" | "leaderboard";

export type GameSession = {
  id: string;
  quiz_id: string;
  room_code: string;
  status: GameSessionStatus;
  current_question_index: number;
  phase: GamePhase | null;
  started_at: string | null;
  question_started_at: string | null;
};

export type Player = {
  id: string;
  session_id: string;
  nickname: string;
  total_score: number;
  joined_at: string;
};

export type QuestionWithAnswers = {
  id: string;
  text: string;
  order_index: number;
  question_display_seconds: number;
  answer_collection_seconds: number;
  answer_display_seconds: number;
  answers: {
    id: string;
    text: string;
    is_correct: boolean;
    order_index: number;
  }[];
};

export type LeaderboardEntry = {
  rank: number;
  player_id: string;
  nickname: string;
  total_score: number;
};