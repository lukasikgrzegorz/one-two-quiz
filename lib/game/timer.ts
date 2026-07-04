import { LEADERBOARD_DISPLAY_SECONDS } from "./constants";
import type { GamePhase, QuestionWithAnswers } from "./types";

export function getPhaseDurationSeconds(
  phase: GamePhase,
  question: QuestionWithAnswers | null,
): number {
  if (!question) return LEADERBOARD_DISPLAY_SECONDS;

  switch (phase) {
    case "question":
      return question.question_display_seconds;
    case "answers":
      return question.answer_collection_seconds;
    case "reveal":
      return question.answer_display_seconds;
    case "leaderboard":
      return LEADERBOARD_DISPLAY_SECONDS;
  }
}

export function getRemainingSeconds(
  startedAt: string | null,
  durationSeconds: number,
): number {
  if (!startedAt) return durationSeconds;

  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(durationSeconds - elapsed));
}