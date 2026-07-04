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
import { useQuestionAnswerDistribution } from "@/hooks/use-question-answer-distribution";
import { useSessionPlayers } from "@/hooks/use-session-players";
import { ANSWER_COLORS } from "@/lib/game/constants";
import { getPhaseDurationSeconds } from "@/lib/game/timer";
import { cn } from "@/lib/utils";
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
  const { distribution, totalAnswered } = useQuestionAnswerDistribution(
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
    return (
      <p className="text-center text-muted-foreground my-auto">Ładowanie...</p>
    );
  }

  if (session.status === "lobby") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 my-auto">
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
      <div className="flex flex-col flex-1 w-full max-w-6xl mx-auto min-h-0">
        <header className="flex items-center justify-between gap-4 shrink-0 pb-4 border-b border-foreground/10">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{quizTitle}</p>
            <p className="text-2xl md:text-3xl font-bold">Koniec gry</p>
          </div>
          <Badge className="shrink-0">Finał</Badge>
        </header>

        <section className="flex-1 flex flex-col gap-4 py-6 md:py-8 min-h-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold shrink-0">
            Ranking
          </h1>
          <div className="flex-1 min-h-0 flex flex-col">
            <LeaderboardView sessionId={sessionId} variant="host" />
          </div>
        </section>

        <footer className="shrink-0 pt-4 border-t border-foreground/10">
          <Button asChild size="lg" className="w-full">
            <Link href="/">Wróć do quizów</Link>
          </Button>
        </footer>
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
  const advanceLabel = isLastQuestion ? "Zakończ grę" : "Następne pytanie";
  const questionNumber = session.current_question_index + 1;

  return (
    <div className="flex flex-col flex-1 w-full max-w-6xl mx-auto min-h-0">
      <header className="flex items-center justify-between gap-4 shrink-0 pb-4 border-b border-foreground/10">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{quizTitle}</p>
          <p className="text-2xl md:text-3xl font-bold tabular-nums">
            Pytanie {questionNumber}{" "}
            <span className="text-muted-foreground font-normal">
              / {totalQuestions}
            </span>
          </p>
        </div>
        <Badge className="shrink-0">{phaseLabel}</Badge>
      </header>

      {isLeaderboard ? (
        <section className="flex-1 flex flex-col gap-4 py-6 md:py-8 min-h-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold shrink-0">
            Ranking
          </h1>
          <div className="flex-1 min-h-0 flex flex-col">
            <LeaderboardView sessionId={sessionId} variant="host" />
          </div>
        </section>
      ) : (
        question && (
          <section className="flex-1 flex items-start justify-center py-6 md:py-10 min-h-0 overflow-y-auto">
            <h1 className="w-full text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              {question.text}
            </h1>
          </section>
        )
      )}

      <footer className="shrink-0 flex flex-col gap-4 pt-4 border-t border-foreground/10">
        {session.phase === "question" && (
          <p className="text-center text-muted-foreground text-sm md:text-base py-2">
            Gracze czytają pytanie — odpowiedzi pojawią się za chwilę
          </p>
        )}

        {session.phase === "answers" && question && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:justify-between">
              <div>
                <p className="text-2xl md:text-3xl font-mono font-bold tabular-nums">
                  {answeredCount} / {players.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  udzielonych odpowiedzi
                </p>
              </div>
              <div className="w-full sm:max-w-xs">
                <GameTimer
                  startedAt={session.question_started_at}
                  durationSeconds={duration}
                />
              </div>
            </div>
            <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full">
              {question.answers.map((a, i) => (
                <li
                  key={a.id}
                  className={cn(
                    "rounded-xl border-2 px-4 py-4 md:py-5 text-base md:text-lg font-semibold",
                    ANSWER_COLORS[i] ?? ANSWER_COLORS[0],
                  )}
                >
                  {String.fromCharCode(65 + i)}. {a.text}
                </li>
              ))}
            </ul>
          </>
        )}

        {session.phase === "reveal" && question && (
          <>
            <p className="text-sm text-muted-foreground">
              {totalAnswered > 0
                ? `${totalAnswered} ${totalAnswered === 1 ? "gracz odpowiedział" : "graczy odpowiedziało"}`
                : "Brak odpowiedzi"}
            </p>
            <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full">
              {question.answers.map((a, i) => {
                const stats = distribution.find((d) => d.answer_id === a.id);
                const percent = stats?.percent ?? 0;

                return (
                  <li
                    key={a.id}
                    className={cn(
                      "relative overflow-hidden rounded-xl border-2 text-base md:text-lg font-semibold",
                      ANSWER_COLORS[i] ?? ANSWER_COLORS[0],
                      a.is_correct
                        ? "ring-2 ring-white ring-offset-2 ring-offset-background"
                        : "opacity-80",
                    )}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-black/20 transition-[width] duration-500 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-3 px-4 py-4 md:py-5">
                      <span className="min-w-0">
                        {String.fromCharCode(65 + i)}. {a.text}
                        {a.is_correct && " ✓"}
                      </span>
                      <span className="shrink-0 font-mono text-xl md:text-2xl font-bold tabular-nums">
                        {percent}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {isLeaderboard && (
          <>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              size="lg"
              onClick={handleAdvance}
              disabled={isAdvancing}
              className="w-full"
            >
              {isAdvancing ? "Przechodzenie..." : advanceLabel}
            </Button>
          </>
        )}

        {!isLeaderboard && error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </footer>
    </div>
  );
}