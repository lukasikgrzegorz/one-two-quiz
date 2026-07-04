"use client";

import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function PlayerRankView({
  sessionId,
  playerToken,
  variant = "inline",
}: {
  sessionId: string;
  playerToken: string;
  variant?: "inline" | "final";
}) {
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchRank = async () => {
      const { data: player } = await supabase
        .from("players")
        .select("id, nickname")
        .eq("player_token", playerToken)
        .single();

      if (!player) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.rpc("get_leaderboard", {
        p_session_id: sessionId,
      });

      const entries = (data as LeaderboardEntry[]) ?? [];
      setTotalPlayers(entries.length);
      setMyEntry(
        entries.find((e) => e.player_id === player.id) ?? null,
      );
      setLoading(false);
    };

    fetchRank();

    const channel = supabase
      .channel(`player-rank-${sessionId}-${playerToken}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `session_id=eq.${sessionId}`,
        },
        () => fetchRank(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, playerToken]);

  if (loading) {
    return (
      <p className="text-center text-muted-foreground text-sm">Ładowanie...</p>
    );
  }

  if (!myEntry) {
    return (
      <p className="text-center text-muted-foreground">
        Nie znaleziono Twojego wyniku
      </p>
    );
  }

  const rankLabel =
    myEntry.rank === 1
      ? "1."
      : myEntry.rank === 2
        ? "2."
        : myEntry.rank === 3
          ? "3."
          : `${myEntry.rank}.`;

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center gap-2",
        variant === "final" && "py-4",
      )}
    >
      <p className="text-sm text-muted-foreground uppercase tracking-wide">
        {variant === "final" ? "Twoje miejsce" : "Jesteś na"}
      </p>
      <p
        className={cn(
          "font-bold tabular-nums",
          variant === "final" ? "text-6xl" : "text-5xl",
        )}
      >
        {rankLabel}
      </p>
      <p className="text-lg font-medium">{myEntry.nickname}</p>
      <p className="text-muted-foreground">
        {myEntry.total_score} pkt
        {totalPlayers > 0 && (
          <span className="text-sm"> · {totalPlayers} graczy</span>
        )}
      </p>
    </div>
  );
}