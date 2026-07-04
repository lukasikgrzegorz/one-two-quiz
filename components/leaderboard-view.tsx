"use client";

import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/lib/game/types";
import { useEffect, useState } from "react";

export function LeaderboardView({ sessionId }: { sessionId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const fetchLeaderboard = async () => {
      const { data } = await supabase.rpc("get_leaderboard", {
        p_session_id: sessionId,
      });

      setEntries((data as LeaderboardEntry[]) ?? []);
    };

    fetchLeaderboard();

    const channel = supabase
      .channel(`leaderboard-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `session_id=eq.${sessionId}`,
        },
        () => fetchLeaderboard(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  if (entries.length === 0) {
    return (
      <p className="text-center text-muted-foreground">Brak graczy w rankingu</p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li
          key={entry.player_id}
          className="flex items-center justify-between rounded-lg border px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 text-center font-mono text-muted-foreground">
              {entry.rank}
            </span>
            <span className="font-medium">{entry.nickname}</span>
          </div>
          <span className="font-mono font-semibold">{entry.total_score}</span>
        </li>
      ))}
    </ol>
  );
}