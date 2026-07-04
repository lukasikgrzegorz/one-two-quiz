"use client";

import { Button } from "@/components/ui/button";
import { HOST_LEADERBOARD_TOP_N } from "@/lib/game/constants";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function LeaderboardRow({
  entry,
  variant,
}: {
  entry: LeaderboardEntry;
  variant: "default" | "host";
}) {
  const isHost = variant === "host";
  const isPodium = isHost && entry.rank <= 3;

  return (
    <li
      className={cn(
        "flex items-center justify-between rounded-lg border",
        isPodium ? "px-5 py-4 md:py-5" : "px-4 py-3",
        entry.rank === 1 && "border-amber-400/60 bg-amber-400/10",
        entry.rank === 2 && "border-slate-400/50 bg-slate-400/10",
        entry.rank === 3 && "border-orange-400/50 bg-orange-400/10",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "shrink-0 text-center font-mono tabular-nums",
            isPodium
              ? "w-10 text-xl md:text-2xl font-bold"
              : "w-8 text-muted-foreground",
          )}
        >
          {entry.rank}
        </span>
        <span
          className={cn(
            "font-medium truncate",
            isPodium ? "text-lg md:text-xl" : undefined,
          )}
        >
          {entry.nickname}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono font-semibold tabular-nums ml-3",
          isPodium ? "text-lg md:text-xl" : undefined,
        )}
      >
        {entry.total_score}
      </span>
    </li>
  );
}

export function LeaderboardView({
  sessionId,
  variant = "default",
}: {
  sessionId: string;
  variant?: "default" | "host";
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [showAll, setShowAll] = useState(false);

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

  const isHost = variant === "host";
  const hasMore = isHost && entries.length > HOST_LEADERBOARD_TOP_N;
  const visibleEntries =
    isHost && !showAll
      ? entries.slice(0, HOST_LEADERBOARD_TOP_N)
      : entries;
  const hiddenCount = entries.length - HOST_LEADERBOARD_TOP_N;

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        isHost && "h-full min-h-0",
      )}
    >
      {isHost && (
        <p className="text-sm text-muted-foreground shrink-0">
          {hasMore && !showAll
            ? `Top ${HOST_LEADERBOARD_TOP_N} z ${entries.length} graczy`
            : `${entries.length} ${entries.length === 1 ? "gracz" : entries.length < 5 ? "graczy" : "graczy"}`}
        </p>
      )}

      <ol
        className={cn(
          "flex flex-col gap-2",
          isHost && showAll && "flex-1 min-h-0 overflow-y-auto pr-1",
        )}
      >
        {visibleEntries.map((entry) => (
          <LeaderboardRow key={entry.player_id} entry={entry} variant={variant} />
        ))}
      </ol>

      {hasMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0"
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll
            ? "Pokaż top 10"
            : `Pokaż pozostałych ${hiddenCount}`}
        </Button>
      )}
    </div>
  );
}