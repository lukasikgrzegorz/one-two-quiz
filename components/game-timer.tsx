"use client";

import { getRemainingSeconds } from "@/lib/game/timer";
import { useEffect, useState } from "react";

export function GameTimer({
  startedAt,
  durationSeconds,
}: {
  startedAt: string | null;
  durationSeconds: number;
}) {
  const [remaining, setRemaining] = useState(() =>
    getRemainingSeconds(startedAt, durationSeconds),
  );

  useEffect(() => {
    const tick = () => {
      setRemaining(getRemainingSeconds(startedAt, durationSeconds));
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [startedAt, durationSeconds]);

  return (
    <div className="text-center">
      <p className="text-5xl font-mono font-bold tabular-nums">{remaining}</p>
      <p className="text-sm text-muted-foreground mt-1">sekund</p>
    </div>
  );
}