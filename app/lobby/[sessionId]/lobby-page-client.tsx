"use client";

import { PlayerLobbyView } from "@/components/player-lobby-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlayerToken, getStoredSessionId } from "@/lib/game/storage";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function LobbyPageClient({ sessionId }: { sessionId: string }) {
  const [playerToken, setPlayerToken] = useState<string | null | undefined>(
    undefined,
  );
  const [nickname, setNickname] = useState<string | undefined>();

  useEffect(() => {
    const token = getPlayerToken();
    const storedSession = getStoredSessionId();

    if (!token || storedSession !== sessionId) {
      setPlayerToken(null);
      return;
    }

    setPlayerToken(token);

    const supabase = createClient();
    supabase
      .from("players")
      .select("nickname")
      .eq("player_token", token)
      .single()
      .then(({ data }) => {
        if (data?.nickname) setNickname(data.nickname);
      });
  }, [sessionId]);

  if (playerToken === undefined) {
    return <p className="text-center text-muted-foreground">Ładowanie...</p>;
  }

  if (!playerToken) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Dołącz do gry</CardTitle>
          <CardDescription>
            Wpisz kod pokoju i nick na stronie głównej.
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

  return <PlayerLobbyView sessionId={sessionId} nickname={nickname} />;
}