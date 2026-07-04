"use client";

import { GameTimer } from "@/components/game-timer";
import { PlayerRankView } from "@/components/player-rank-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentQuestion } from "@/hooks/use-current-question";
import { useGameSession } from "@/hooks/use-game-session";
import { ANSWER_COLORS } from "@/lib/game/constants";
import { getPhaseDurationSeconds } from "@/lib/game/timer";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function PlayerGameView({
  sessionId,
  playerToken,
}: {
  sessionId: string;
  playerToken: string;
}) {
  const { session, loading } = useGameSession(sessionId);
  const question = useCurrentQuestion(session);
  const [answeredQuestionId, setAnsweredQuestionId] = useState<string | null>(
    null,
  );
  const [roundPoints, setRoundPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (question && question.id !== answeredQuestionId) {
      setAnsweredQuestionId(null);
      setRoundPoints(null);
    }
  }, [question?.id, answeredQuestionId, question]);

  const handleAnswer = async (answerId: string) => {
    if (!question || !session || session.phase !== "answers") return;
    if (answeredQuestionId === question.id) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: submitError } = await supabase.rpc(
      "submit_player_answer",
      {
        p_player_token: playerToken,
        p_question_id: question.id,
        p_answer_id: answerId,
      },
    );

    if (submitError) {
      setError(submitError.message);
    } else {
      setAnsweredQuestionId(question.id);
      setRoundPoints(
        typeof data?.points_earned === "number" ? data.points_earned : 0,
      );
    }

    setSubmitting(false);
  };

  if (loading) {
    return <p className="text-center text-muted-foreground">Ładowanie...</p>;
  }

  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-center">
        <p className="text-muted-foreground">Nie udało się połączyć z grą.</p>
        <Button asChild>
          <Link href="/">Wróć na stronę główną</Link>
        </Button>
      </div>
    );
  }

  if (session.status === "lobby") {
    return (
      <p className="text-center text-muted-foreground">
        Oczekiwanie na start gry...
      </p>
    );
  }

  if (session.status === "finished") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1 gap-6 self-start md:self-center min-h-[60vh]">
        <div className="flex items-center justify-end shrink-0">
          <Badge variant="secondary">Koniec gry</Badge>
        </div>

        <section className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Ranking
          </h1>
          <PlayerRankView
            sessionId={sessionId}
            playerToken={playerToken}
            variant="final"
          />
        </section>

        <footer className="shrink-0">
          <Button asChild size="lg" className="w-full">
            <Link href="/">Wróć na stronę główną</Link>
          </Button>
        </footer>
      </div>
    );
  }

  if (!question) {
    return <p className="text-center text-muted-foreground">Ładowanie pytania...</p>;
  }

  const duration = getPhaseDurationSeconds(session.phase!, question);
  const hasAnswered = answeredQuestionId === question.id;

  const phaseBadge =
    session.phase === "question"
      ? "Przeczytaj pytanie"
      : session.phase === "answers"
        ? "Odpowiedz!"
        : session.phase === "reveal"
          ? "Wynik"
          : "Twój wynik";

  if (session.phase === "question") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 my-auto">
        <Badge variant="secondary" className="w-fit">
          {phaseBadge}
        </Badge>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-snug text-center">
              {question.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground text-sm">
              Zaraz pojawią się odpowiedzi...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.phase === "answers") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 self-start md:self-center">
        <div className="flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit">
            {phaseBadge}
          </Badge>
          <GameTimer
            startedAt={session.question_started_at}
            durationSeconds={duration}
          />
        </div>
        <div className="grid gap-3">
          {hasAnswered ? (
            <p className="text-center text-muted-foreground py-8">
              Odpowiedź zapisana — czekaj na wynik
            </p>
          ) : (
            question.answers.map((answer, index) => (
              <button
                key={answer.id}
                type="button"
                disabled={submitting}
                onClick={() => handleAnswer(answer.id)}
                className={cn(
                  "rounded-xl border-2 px-4 py-5 text-left font-semibold transition-opacity disabled:opacity-60",
                  ANSWER_COLORS[index] ?? ANSWER_COLORS[0],
                )}
              >
                {answer.text}
              </button>
            ))
          )}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>
      </div>
    );
  }

  if (session.phase === "reveal") {
    const correctAnswer = question.answers.find((a) => a.is_correct);

    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 my-auto">
        <Badge variant="secondary" className="w-fit">
          {phaseBadge}
        </Badge>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-muted-foreground font-normal">
              Poprawna odpowiedź
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-xl font-semibold text-center text-green-600 dark:text-green-400">
              {correctAnswer?.text ?? "—"}
            </p>
            {roundPoints !== null && (
              <p
                className={`text-center text-2xl font-bold tabular-nums ${
                  roundPoints > 0
                    ? "text-amber-500"
                    : "text-muted-foreground"
                }`}
              >
                {roundPoints > 0 ? `+${roundPoints} pkt` : "0 pkt"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col flex-1 gap-6 my-auto min-h-[50vh]">
      <div className="flex items-center justify-end shrink-0">
        <Badge variant="secondary">{phaseBadge}</Badge>
      </div>

      <section className="flex-1 flex flex-col items-center justify-center gap-6 py-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Ranking</h1>
        <PlayerRankView
          sessionId={sessionId}
          playerToken={playerToken}
          variant="inline"
        />
        <p className="text-center text-sm text-muted-foreground">
          Poczekaj, aż prowadzący przejdzie dalej...
        </p>
      </section>
    </div>
  );
}