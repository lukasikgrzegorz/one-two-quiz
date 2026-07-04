"use client";

import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/game/types";
import { useEffect, useState } from "react";

export function useSessionPlayers(sessionId: string) {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("id, session_id, nickname, total_score, joined_at")
        .eq("session_id", sessionId)
        .order("joined_at");

      setPlayers((data as Player[]) ?? []);
    };

    fetchPlayers();

    const channel = supabase
      .channel(`players-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchPlayers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return players;
}