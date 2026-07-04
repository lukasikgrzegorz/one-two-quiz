"use client";

import { QuestionForm } from "@/components/question-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AddQuestionForm({ quizId }: { quizId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Dodaj pytanie</CardTitle>
        <CardDescription>
          Ustaw czasy, dodaj 2–4 odpowiedzi i zaznacz poprawną
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QuestionForm quizId={quizId} />
      </CardContent>
    </Card>
  );
}