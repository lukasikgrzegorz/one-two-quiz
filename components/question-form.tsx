"use client";

import { addQuestion, updateQuestion } from "@/lib/actions/questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

const MIN_ANSWERS = 2;
const MAX_ANSWERS = 4;
const DEFAULT_QUESTION_SECONDS = 10;
const DEFAULT_ANSWER_SECONDS = 5;

export type QuestionFormInitial = {
  text: string;
  question_display_seconds: number;
  answer_display_seconds: number;
  answers: { text: string; is_correct: boolean }[];
};

export function QuestionForm({
  quizId,
  questionId,
  initial,
  onCancel,
  onSuccess,
}: {
  quizId: string;
  questionId?: string;
  initial?: QuestionFormInitial;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const isEdit = !!questionId && !!initial;

  const initialAnswerCount = Math.max(
    MIN_ANSWERS,
    initial?.answers.length ?? MIN_ANSWERS,
  );
  const initialCorrectIndex =
    initial?.answers.findIndex((a) => a.is_correct) ?? 0;

  const [answerCount, setAnswerCount] = useState(initialAnswerCount);
  const [correctIndex, setCorrectIndex] = useState(
    initialCorrectIndex >= 0 ? initialCorrectIndex : 0,
  );
  const [formKey, setFormKey] = useState(0);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = isEdit
        ? await updateQuestion(quizId, questionId!, formData)
        : await addQuestion(quizId, formData);

      if (!result.error) {
        if (!isEdit) {
          setAnswerCount(MIN_ANSWERS);
          setCorrectIndex(0);
          setFormKey((k) => k + 1);
        }
        router.refresh();
        onSuccess?.();
      }
      return result;
    },
    null,
  );

  const addAnswerField = () => {
    if (answerCount < MAX_ANSWERS) {
      setAnswerCount((c) => c + 1);
    }
  };

  const removeAnswerField = () => {
    if (answerCount > MIN_ANSWERS) {
      setAnswerCount((c) => {
        const next = c - 1;
        if (correctIndex >= next) {
          setCorrectIndex(next - 1);
        }
        return next;
      });
    }
  };

  return (
    <form
      key={isEdit ? questionId : formKey}
      action={formAction}
      className="flex flex-col gap-5"
    >
      <div className="grid gap-2">
        <Label htmlFor={isEdit ? `question_text_${questionId}` : "question_text"}>
          Treść pytania
        </Label>
        <Input
          id={isEdit ? `question_text_${questionId}` : "question_text"}
          name="question_text"
          placeholder="np. Jaka jest stolica Polski?"
          required
          maxLength={500}
          defaultValue={initial?.text}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={isEdit ? `question_seconds_${questionId}` : "question_display_seconds"}>
            Czas na pytanie (s)
          </Label>
          <Input
            id={isEdit ? `question_seconds_${questionId}` : "question_display_seconds"}
            name="question_display_seconds"
            type="number"
            min={1}
            max={300}
            required
            defaultValue={
              initial?.question_display_seconds ?? DEFAULT_QUESTION_SECONDS
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={isEdit ? `answer_seconds_${questionId}` : "answer_display_seconds"}>
            Czas na odpowiedź (s)
          </Label>
          <Input
            id={isEdit ? `answer_seconds_${questionId}` : "answer_display_seconds"}
            name="answer_display_seconds"
            type="number"
            min={1}
            max={120}
            required
            defaultValue={
              initial?.answer_display_seconds ?? DEFAULT_ANSWER_SECONDS
            }
          />
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <Label>Odpowiedzi</Label>
          <div className="flex gap-2">
            {answerCount > MIN_ANSWERS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeAnswerField}
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
            {answerCount < MAX_ANSWERS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAnswerField}
              >
                <Plus className="h-4 w-4 mr-1" />
                Odpowiedź
              </Button>
            )}
          </div>
        </div>

        {Array.from({ length: answerCount }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="radio"
              name="correct_index"
              value={index}
              checked={correctIndex === index}
              onChange={() => setCorrectIndex(index)}
              className="h-4 w-4 shrink-0 accent-primary"
              aria-label={`Poprawna odpowiedź ${index + 1}`}
            />
            <Input
              name={`answer_${index}`}
              placeholder={`Odpowiedź ${String.fromCharCode(65 + index)}`}
              required
              maxLength={200}
              className="flex-1"
              defaultValue={initial?.answers[index]?.text}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Zaznacz kółko przy poprawnej odpowiedzi
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending
            ? "Zapisywanie..."
            : isEdit
              ? "Zapisz zmiany"
              : "Dodaj pytanie"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
        )}
      </div>
    </form>
  );
}