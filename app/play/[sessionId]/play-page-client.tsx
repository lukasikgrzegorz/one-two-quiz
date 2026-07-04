"use client";

import { PlayerGameView } from "@/components/player-game-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlayerToken, getStoredSessionId } from "@/lib/game/storage";
import Link from "next/link";
import { useEffect, useState } from "react";

export function PlayPageClient({ sessionId }: { sessionId: string }) {
  const [playerToken, setPlayerToken] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const token = getPlayerToken();
    const storedSession = getStoredSessionId();

    if (!token || storedSession !== sessionId) {
      setPlayerToken(null);
      return;
    }

    setPlayerToken(token);
  }, [sessionId]);

  if (playerToken === undefined) {
    return <p className="text-center text-muted-foreground">Ładowanie...</p>;
  }

  if (!playerToken) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Nie jesteś w tej grze</CardTitle>
          <CardDescription>
            Dołącz do pokoju ze strony głównej, wpisując kod i nick.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Strona główna</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <PlayerGameView sessionId={sessionId} playerToken={playerToken} />
  );
}