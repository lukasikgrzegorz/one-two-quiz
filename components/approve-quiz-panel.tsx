"use client";

import { approveQuiz, unapproveQuiz } from "@/lib/actions/quizzes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApproveQuizPanel({
  quizId,
  status,
  questionCount,
}: {
  quizId: string;
  status: "draft" | "approved";
  questionCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleApprove = async () => {
    setIsPending(true);
    setError(null);

    const result = await approveQuiz(quizId);

    if (result.error) {
      setError(result.error);
      setIsPending(false);
      return;
    }

    router.refresh();
    setIsPending(false);
  };

  const handleUnapprove = async () => {
    setIsPending(true);
    setError(null);

    const result = await unapproveQuiz(quizId);

    if (result.error) {
      setError(result.error);
      setIsPending(false);
      return;
    }

    router.refresh();
    setIsPending(false);
  };

  const isApproved = status === "approved";

  return (
    <Card className={isApproved ? "border-green-500/40 bg-green-500/5" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl flex items-center gap-2">
            {isApproved ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <CircleDashed className="h-5 w-5 text-muted-foreground" />
            )}
            {isApproved ? "Quiz zatwierdzony" : "Zatwierdź quiz"}
          </CardTitle>
          <Badge variant={isApproved ? "default" : "secondary"}>
            {isApproved ? "Gotowy do gry" : "Szkic"}
          </Badge>
        </div>
        <CardDescription>
          {isApproved
            ? "Quiz jest kompletny i gotowy do uruchomienia sesji."
            : "Zatwierdź quiz, gdy dodasz wszystkie pytania. Sprawdzimy, czy każde ma 2–4 odpowiedzi i jedną poprawną."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {isApproved ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleUnapprove}
            disabled={isPending}
          >
            {isPending ? "Cofanie..." : "Cofnij zatwierdzenie"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleApprove}
            disabled={isPending || questionCount === 0}
          >
            {isPending ? "Sprawdzanie..." : "Zatwierdź quiz"}
          </Button>
        )}

        {questionCount === 0 && !isApproved && (
          <p className="text-xs text-muted-foreground">
            Dodaj co najmniej jedno pytanie, żeby móc zatwierdzić quiz.
          </p>
        )}
      </CardContent>
    </Card>
  );
}