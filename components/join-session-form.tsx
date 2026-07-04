"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PLAYER_TOKEN_KEY = "one-two-quiz-player-token";
const SESSION_ID_KEY = "one-two-quiz-session-id";

export function JoinSessionForm() {
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { data, error: joinError } = await supabase.rpc("join_session", {
        p_room_code: roomCode.trim().toUpperCase(),
        p_nickname: nickname.trim(),
      });

      if (joinError) throw joinError;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result?.player_token || !result?.session_id) {
        throw new Error("Nie udało się dołączyć do sesji");
      }

      localStorage.setItem(PLAYER_TOKEN_KEY, result.player_token);
      localStorage.setItem(SESSION_ID_KEY, result.session_id);

      router.push(`/lobby/${result.session_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Dołącz do gry</CardTitle>
        <CardDescription>
          Wpisz kod pokoju i swój nick, żeby wejść do lobby
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="room-code">Kod pokoju</Label>
            <Input
              id="room-code"
              placeholder="ABC123"
              required
              maxLength={6}
              value={roomCode}
              onChange={(e) =>
                setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              className="text-center text-2xl font-mono tracking-widest uppercase"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nickname">Nick</Label>
            <Input
              id="nickname"
              placeholder="Twój nick"
              required
              maxLength={30}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Dołączanie..." : "Dołącz"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Prowadzisz quiz?{" "}
          <Link href="/auth/login" className="underline underline-offset-4">
            Zaloguj się jako host
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}