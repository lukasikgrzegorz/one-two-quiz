"use client";

import { DeleteQuestionButton } from "@/components/delete-question-button";
import { QuestionForm, type QuestionFormInitial } from "@/components/question-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Clock, Pencil } from "lucide-react";
import { useState } from "react";

export function QuestionCard({
  quizId,
  index,
  question,
}: {
  quizId: string;
  index: number;
  question: {
    id: string;
    text: string;
    question_display_seconds: number;
    answer_collection_seconds: number;
    answer_display_seconds: number;
    answers: { id: string; text: string; is_correct: boolean; order_index: number }[];
  };
}) {
  const [isEditing, setIsEditing] = useState(false);

  const initial: QuestionFormInitial = {
    text: question.text,
    question_display_seconds: question.question_display_seconds,
    answer_collection_seconds: question.answer_collection_seconds,
    answer_display_seconds: question.answer_display_seconds,
    answers: question.answers.map((a) => ({
      text: a.text,
      is_correct: a.is_correct,
    })),
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium leading-snug">
              <span className="text-muted-foreground mr-2">{index + 1}.</span>
              {question.text}
            </CardTitle>
            {!isEditing && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pytanie: {question.question_display_seconds}s · Wybór:{" "}
                {question.answer_collection_seconds}s · Wynik:{" "}
                {question.answer_display_seconds}s
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <DeleteQuestionButton quizId={quizId} questionId={question.id} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isEditing ? (
          <QuestionForm
            quizId={quizId}
            questionId={question.id}
            initial={initial}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {question.answers.map((answer, answerIndex) => (
              <li
                key={answer.id}
                className="flex items-center gap-2 text-sm"
              >
                <span className="w-5 text-muted-foreground font-mono">
                  {String.fromCharCode(65 + answerIndex)}.
                </span>
                <span className="flex-1">{answer.text}</span>
                {answer.is_correct && (
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Check className="h-3 w-3" />
                    Poprawna
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}