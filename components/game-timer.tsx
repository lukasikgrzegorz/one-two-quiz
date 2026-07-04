"use client";

import { useEffect, useRef, useState } from "react";

export function GameTimer({
  startedAt,
  durationSeconds,
}: {
  startedAt: string | null;
  durationSeconds: number;
}) {
  const [displaySeconds, setDisplaySeconds] = useState(durationSeconds);
  const [progress, setProgress] = useState(1);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!startedAt || durationSeconds <= 0) {
      setDisplaySeconds(durationSeconds);
      setProgress(1);
      return;
    }

    const endTime =
      new Date(startedAt).getTime() + durationSeconds * 1000;

    const tick = () => {
      const remainingMs = Math.max(0, endTime - Date.now());
      const fraction = remainingMs / (durationSeconds * 1000);

      setProgress(fraction);
      setDisplaySeconds(Math.ceil(remainingMs / 1000));

      if (remainingMs > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [startedAt, durationSeconds]);

  return (
    <div className="w-full">
      <div className="text-center">
        <p className="text-5xl font-mono font-bold tabular-nums">
          {displaySeconds}
        </p>
        <p className="text-sm text-muted-foreground mt-1">sekund</p>
      </div>
      <div className="mt-3 h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rainbow-gradient rounded-full will-change-[width]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}