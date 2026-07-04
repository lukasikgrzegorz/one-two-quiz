"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export type RoundScore = {
  player_id: string;
  nickname: string;
  points_earned: number;
};

export function useQuestionRoundScores(
  sessionId: string,
  questionId: string | null,
) {
  const [scores, setScores] = useState<RoundScore[]>([]);

  useEffect(() => {
    if (!questionId) {
      setScores([]);
      return;
    }

    const supabase = createClient();

    const fetchScores = async () => {
      const { data } = await supabase
        .from("player_answers")
        .select(
          "points_earned, players!inner(id, nickname, session_id)",
        )
        .eq("question_id", questionId)
        .eq("players.session_id", sessionId)
        .order("points_earned", { ascending: false });

      setScores(
        (data ?? []).flatMap((row) => {
          const player = Array.isArray(row.players)
            ? row.players[0]
            : row.players;

          if (!player) return [];

          return [
            {
              player_id: player.id as string,
              nickname: player.nickname as string,
              points_earned: row.points_earned as number,
            },
          ];
        }),
      );
    };

    fetchScores();

    const channel = supabase
      .channel(`round-scores-${sessionId}-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_answers",
          filter: `question_id=eq.${questionId}`,
        },
        () => {
          fetchScores();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, questionId]);

  return scores;
}