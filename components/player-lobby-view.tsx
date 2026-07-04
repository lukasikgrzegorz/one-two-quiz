"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGameSession } from "@/hooks/use-game-session";
import { useSessionPlayers } from "@/hooks/use-session-players";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PlayerLobbyView({
  sessionId,
  nickname,
}: {
  sessionId: string;
  nickname?: string;
}) {
  const { session, loading } = useGameSession(sessionId);
  const players = useSessionPlayers(sessionId);
  const router = useRouter();

  useEffect(() => {
    if (session?.status === "active") {
      router.push(`/play/${sessionId}`);
    }
    if (session?.status === "finished") {
      router.push(`/play/${sessionId}`);
    }
  }, [session?.status, sessionId, router]);

  if (loading || !session) {
    return <p className="text-center text-muted-foreground">Ładowanie...</p>;
  }

  return (
    <Card className="w-full max-w-md mx-auto text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Czekasz w lobby</CardTitle>
        <CardDescription>
          {nickname ? (
            <>
              Witaj, <strong>{nickname}</strong>! Host wkrótce rozpocznie grę.
            </>
          ) : (
            "Host wkrótce rozpocznie grę."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-4xl font-mono tracking-widest">{session.room_code}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {players.length} w pokoju
        </div>
        {players.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-2">
            {players.map((p) => (
              <Badge key={p.id} variant="secondary">
                {p.nickname}
              </Badge>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}