"use client";

import { createClient } from "@/lib/supabase/client";
import type { GameSession } from "@/lib/game/types";
import { useEffect, useState } from "react";

export function useGameSession(sessionId: string) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchSession = async () => {
      const { data } = await supabase
        .from("game_sessions")
        .select(
          "id, quiz_id, room_code, status, current_question_index, phase, started_at, question_started_at",
        )
        .eq("id", sessionId)
        .single();

      setSession(data as GameSession | null);
      setLoading(false);
    };

    fetchSession();

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => {
          fetchSession();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, loading };
}