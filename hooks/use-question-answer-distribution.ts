"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export type AnswerDistribution = {
  answer_id: string;
  count: number;
  percent: number;
};

export function useQuestionAnswerDistribution(
  sessionId: string,
  questionId: string | null,
) {
  const [distribution, setDistribution] = useState<AnswerDistribution[]>([]);
  const [totalAnswered, setTotalAnswered] = useState(0);

  useEffect(() => {
    if (!questionId) {
      setDistribution([]);
      setTotalAnswered(0);
      return;
    }

    const supabase = createClient();

    const fetchDistribution = async () => {
      const { data } = await supabase
        .from("player_answers")
        .select("answer_id, players!inner(session_id)")
        .eq("question_id", questionId)
        .eq("players.session_id", sessionId);

      const rows = data ?? [];
      const total = rows.length;
      const counts = new Map<string, number>();

      for (const row of rows) {
        if (!row.answer_id) continue;
        counts.set(row.answer_id, (counts.get(row.answer_id) ?? 0) + 1);
      }

      setTotalAnswered(total);
      setDistribution(
        [...counts.entries()].map(([answer_id, count]) => ({
          answer_id,
          count,
          percent: total > 0 ? Math.round((count / total) * 100) : 0,
        })),
      );
    };

    fetchDistribution();

    const channel = supabase
      .channel(`answer-distribution-${sessionId}-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_answers",
          filter: `question_id=eq.${questionId}`,
        },
        () => {
          fetchDistribution();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, questionId]);

  return { distribution, totalAnswered };
}