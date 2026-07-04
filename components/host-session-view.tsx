"use client";

import { advanceGame, startGame } from "@/lib/actions/sessions";
import { GameTimer } from "@/components/game-timer";
import { LeaderboardView } from "@/components/leaderboard-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentQuestion } from "@/hooks/use-current-question";
import { useGameSession } from "@/hooks/use-game-session";
import { useQuestionAnswerCount } from "@/hooks/use-question-answer-count";
import { useQuestionRoundScores } from "@/hooks/use-question-round-scores";
import { useSessionPlayers } from "@/hooks/use-session-players";
import { getPhaseDurationSeconds } from "@/lib/game/timer";
import { Check, Copy, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function HostSessionView({
  sessionId,
  quizTitle,
  totalQuestions,
}: {
  sessionId: string;
  quizTitle: string;
  totalQuestions: number;
}) {
  const { session, loading } = useGameSession(sessionId);
  const players = useSessionPlayers(sessionId);
  const question = useCurrentQuestion(session);
  const answeredCount = useQuestionAnswerCount(
    sessionId,
    session?.phase === "answers" ? (question?.id ?? null) : null,
  );
  const roundScores = useQuestionRoundScores(
    sessionId,
    session?.phase === "reveal" ? (question?.id ?? null) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [copied, setCopied] = useState(false);
  const advanceRef = useRef(false);

  useEffect(() => {
    if (!session || session.status !== "active" || !session.phase) return;
    if (session.phase === "leaderboard") return;

    const duration = getPhaseDurationSeconds(session.phase, question);
    const remaining = session.question_started_at
      ? Math.max(
          0,
          duration -
            (Date.now() - new Date(session.question_started_at).getTime()) /
              1000,
        )
      : duration;

    advanceRef.current = false;

    const timer = setTimeout(async () => {
      if (advanceRef.current) return;
      advanceRef.current = true;
      setIsAdvancing(true);
      await advanceGame(sessionId);
      setIsAdvancing(false);
    }, remaining * 1000);

    return () => clearTimeout(timer);
  }, [session, question, sessionId]);

  const handleStart = async () => {
    setError(null);
    const result = await startGame(sessionId);
    if (result.error) setError(result.error);
  };

  const handleAdvance = async () => {
    setError(null);
    advanceRef.current = true;
    setIsAdvancing(true);
    const result = await advanceGame(sessionId);
    if (result.error) setError(result.error);
    setIsAdvancing(false);
  };

  const copyCode = async () => {
    if (!session?.room_code) return;
    await navigator.clipboard.writeText(session.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !session) {
    return <p className="text-center text-muted-foreground">Ładowanie...</p>;
  }

  if (session.status === "lobby") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardDescription>{quizTitle}</CardDescription>
            <CardTitle className="text-5xl font-mono tracking-widest mt-2">
              {session.room_code}
            </CardTitle>
            <CardDescription className="mt-2">
              Podaj ten kod graczom na stronie głównej
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button variant="outline" onClick={copyCode}>
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Skopiowano!" : "Kopiuj kod"}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {players.length}{" "}
              {players.length === 1 ? "gracz" : players.length < 5 ? "graczy" : "graczy"}{" "}
              w lobby
            </div>
            {players.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <Badge key={p.id} variant="secondary">
                    {p.nickname}
                  </Badge>
                ))}
              </ul>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button size="lg" onClick={handleStart} disabled={players.length === 0}>
              Rozpocznij grę
            </Button>
            {players.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Poczekaj, aż przynajmniej jeden gracz dołączy do lobby
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.status === "finished") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Koniec gry!</CardTitle>
            <CardDescription>{quizTitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardView sessionId={sessionId} />
            <Button asChild className="w-full mt-6">
              <Link href="/">Wróć do quizów</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const phaseLabel =
    session.phase === "question"
      ? "Pytanie"
      : session.phase === "answers"
        ? "Odpowiedzi"
        : session.phase === "reveal"
          ? "Wynik"
          : "Ranking";

  const duration = getPhaseDurationSeconds(session.phase!, question);
  const isLastQuestion =
    session.current_question_index + 1 >= totalQuestions;
  const isLeaderboard = session.phase === "leaderboard";
  const advanceLabel = isLeaderboard
    ? isLastQuestion
      ? "Zakończ grę"
      : "Następne pytanie"
    : "Następna faza";

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{quizTitle}</p>
          <p className="font-medium">
            Pytanie {session.current_question_index + 1} / {totalQuestions}
          </p>
        </div>
        <Badge>{phaseLabel}</Badge>
      </div>

      {session.phase === "answers" ? (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <p className="text-3xl font-mono font-bold tabular-nums">
              {answeredCount} / {players.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              udzielonych odpowiedzi
            </p>
          </div>
          <GameTimer
            startedAt={session.question_started_at}
            durationSeconds={duration}
          />
        </div>
      ) : (
        !isLeaderboard && (
          <GameTimer
            startedAt={session.question_started_at}
            durationSeconds={duration}
          />
        )
      )}

      {question && session.phase === "question" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{question.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground text-sm">
              Gracze czytają pytanie — odpowiedzi pojawią się za chwilę
            </p>
          </CardContent>
        </Card>
      )}

      {question && session.phase === "answers" && (
        <Card>
          <CardHeader>
            <CardTitle>{question.text}</CardTitle>
            <CardDescription>Gracze wybierają odpowiedź</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {question.answers.map((a, i) => (
                <li
                  key={a.id}
                  className="rounded-lg border px-4 py-3 text-sm font-medium"
                >
                  {String.fromCharCode(65 + i)}. {a.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {question && session.phase === "reveal" && (
        <Card>
          <CardHeader>
            <CardTitle>{question.text}</CardTitle>
            <CardDescription>Poprawna odpowiedź</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {question.answers.map((a, i) => (
                <li
                  key={a.id}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                    a.is_correct ? "border-green-500 bg-green-500/10" : ""
                  }`}
                >
                  {String.fromCharCode(65 + i)}. {a.text}
                  {a.is_correct && " ✓"}
                </li>
              ))}
            </ul>
            {roundScores.length > 0 && (
              <ul className="mt-4 space-y-2 border-t pt-4">
                {roundScores.map((entry) => (
                  <li
                    key={entry.player_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{entry.nickname}</span>
                    <span className="font-mono font-semibold tabular-nums">
                      +{entry.points_earned} pkt
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {isLeaderboard && (
        <Card>
          <CardHeader>
            <CardTitle>Ranking</CardTitle>
            <CardDescription>
              Sprawdź wyniki, potem przejdź dalej przyciskiem poniżej
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardView sessionId={sessionId} />
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button
        size={isLeaderboard ? "lg" : "default"}
        variant={isLeaderboard ? "default" : "outline"}
        onClick={handleAdvance}
        disabled={isAdvancing}
        className={isLeaderboard ? "w-full" : undefined}
      >
        {isAdvancing ? "Przechodzenie..." : advanceLabel}
      </Button>
    </div>
  );
}