"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function useQuestionAnswerCount(
  sessionId: string,
  questionId: string | null,
) {
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    if (!questionId) {
      setAnsweredCount(0);
      return;
    }

    const supabase = createClient();

    const fetchCount = async () => {
      const { data: sessionPlayers } = await supabase
        .from("players")
        .select("id")
        .eq("session_id", sessionId);

      if (!sessionPlayers?.length) {
        setAnsweredCount(0);
        return;
      }

      const { count } = await supabase
        .from("player_answers")
        .select("*", { count: "exact", head: true })
        .eq("question_id", questionId)
        .in(
          "player_id",
          sessionPlayers.map((player) => player.id),
        );

      setAnsweredCount(count ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel(`answers-${sessionId}-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_answers",
          filter: `question_id=eq.${questionId}`,
        },
        () => {
          fetchCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, questionId]);

  return answeredCount;
}