import { AddQuestionForm } from "@/components/add-question-form";
import { ApproveQuizPanel } from "@/components/approve-quiz-panel";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { requireQuizOwnership } from "@/lib/actions/auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Answer = {
  id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
};

type Question = {
  id: string;
  text: string;
  order_index: number;
  question_display_seconds: number;
  answer_collection_seconds: number;
  answer_display_seconds: number;
  answers: Answer[];
};

export async function QuizEditor({ quizId }: { quizId: string }) {
  const { supabase, quiz } = await requireQuizOwnership(quizId);

  const { data: questions, error } = await supabase
    .from("questions")
    .select(
      "id, text, order_index, question_display_seconds, answer_collection_seconds, answer_display_seconds, answers(id, text, is_correct, order_index)",
    )
    .eq("quiz_id", quizId)
    .order("order_index");

  if (error) {
    return (
      <p className="text-sm text-destructive text-center">
        Nie udało się załadować pytań: {error.message}
      </p>
    );
  }

  const questionList = ((questions ?? []) as Question[]).map((q) => ({
    ...q,
    answers: [...(q.answers ?? [])].sort(
      (a, b) => a.order_index - b.order_index,
    ),
  }));

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć do quizów
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground mt-1">
            {questionList.length}{" "}
            {questionList.length === 1
              ? "pytanie"
              : questionList.length < 5
                ? "pytania"
                : "pytań"}
          </p>
        </div>
      </div>

      <ApproveQuizPanel
        quizId={quizId}
        status={quiz.status as "draft" | "approved"}
        questionCount={questionList.length}
      />

      {questionList.length > 0 && (
        <ul className="flex flex-col gap-3">
          {questionList.map((question, index) => (
            <li key={question.id}>
              <QuestionCard
                quizId={quizId}
                index={index}
                question={question}
              />
            </li>
          ))}
        </ul>
      )}

      <AddQuestionForm quizId={quizId} />
    </div>
  );
}