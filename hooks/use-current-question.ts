"use client";

import { createClient } from "@/lib/supabase/client";
import type { GameSession, QuestionWithAnswers } from "@/lib/game/types";
import { useEffect, useState } from "react";

export function useCurrentQuestion(
  session: GameSession | null,
) {
  const [question, setQuestion] = useState<QuestionWithAnswers | null>(null);

  useEffect(() => {
    if (!session || session.status !== "active") {
      setQuestion(null);
      return;
    }

    const supabase = createClient();

    const fetchQuestion = async () => {
      const { data } = await supabase
        .from("questions")
        .select(
          "id, text, order_index, question_display_seconds, answer_collection_seconds, answer_display_seconds, answers(id, text, is_correct, order_index)",
        )
        .eq("quiz_id", session.quiz_id)
        .eq("order_index", session.current_question_index)
        .single();

      if (data) {
        const q = data as QuestionWithAnswers;
        setQuestion({
          ...q,
          answer_collection_seconds: q.answer_collection_seconds ?? 15,
          answers: [...(q.answers ?? [])].sort(
            (a, b) => a.order_index - b.order_index,
          ),
        });
      }
    };

    fetchQuestion();
  }, [
    session?.quiz_id,
    session?.status,
    session?.current_question_index,
    session,
  ]);

  return question;
}