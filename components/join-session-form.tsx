"use client";

import { AppLogo } from "@/components/app-logo";
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
import { useRouter } from "next/navigation";
import { useState } from "react";

import { storePlayerSession } from "@/lib/game/storage";

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

      storePlayerSession(result.player_token, result.session_id);

      router.push(`/lobby/${result.session_id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof err.message === "string"
            ? err.message
            : "Wystąpił błąd podczas dołączania do gry";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <AppLogo size="lg" />
        <div className="h-1.5 w-full max-w-xs rounded-full rainbow-gradient" />
      </div>
      <Card>
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
      </CardContent>
    </Card>
    </div>
  );
}