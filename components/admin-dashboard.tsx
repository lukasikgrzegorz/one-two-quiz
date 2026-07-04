import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartSessionButton } from "@/components/start-session-button";
import { createClient } from "@/lib/supabase/server";
import { Pencil } from "lucide-react";
import Link from "next/link";

type QuizRow = {
  id: string;
  title: string;
  status: "draft" | "approved";
  created_at: string;
  questions: { count: number }[];
};

export async function AdminDashboard() {
  const supabase = await createClient();

  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("id, title, status, created_at, questions(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive text-center">
            Nie udało się załadować quizów: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const quizList = (quizzes ?? []) as QuizRow[];

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Twoje quizy</h1>
          <p className="text-muted-foreground mt-1">
            Twórz quizy i uruchamiaj sesje gry
          </p>
        </div>
        <Button asChild variant="rainbow">
          <Link href="/admin/quizzes/new">
            <span className="rainbow-text font-semibold">+ Nowy quiz</span>
          </Link>
        </Button>
      </div>

      {quizList.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Brak quizów</CardTitle>
            <CardDescription>
              Stwórz pierwszy quiz, żeby rozpocząć grę z grupą
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button asChild variant="rainbow">
              <Link href="/admin/quizzes/new">
                <span className="rainbow-text font-semibold">
                  + Stwórz pierwszy quiz
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {quizList.map((quiz) => {
            const questionCount = quiz.questions?.[0]?.count ?? 0;

            return (
              <li key={quiz.id}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{quiz.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {quiz.status === "approved" && <Badge>Gotowy</Badge>}
                        <Badge variant="secondary">
                          {questionCount}{" "}
                          {questionCount === 1
                            ? "pytanie"
                            : questionCount < 5
                              ? "pytania"
                              : "pytań"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-36"
                      >
                        <Link href={`/admin/quizzes/${quiz.id}`}>
                          <Pencil />
                          Edytuj
                        </Link>
                      </Button>
                      {quiz.status === "approved" && (
                        <StartSessionButton
                          quizId={quiz.id}
                          size="sm"
                          className="w-36"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}