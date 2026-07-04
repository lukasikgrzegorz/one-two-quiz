import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
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
      <Card className="w-full max-w-2xl mx-auto">
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
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Twoje quizy</h1>
          <p className="text-muted-foreground mt-1">
            Twórz quizy i uruchamiaj sesje gry
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/quizzes/new">
            <Plus className="mr-2 h-4 w-4" />
            Nowy quiz
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
            <Button asChild>
              <Link href="/admin/quizzes/new">
                <Plus className="mr-2 h-4 w-4" />
                Stwórz pierwszy quiz
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
                <Link href={`/admin/quizzes/${quiz.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{quiz.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(quiz.created_at).toLocaleDateString(
                            "pl-PL",
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {quiz.status === "approved" && (
                          <Badge>Gotowy</Badge>
                        )}
                        <Badge variant="secondary">
                          {questionCount}{" "}
                          {questionCount === 1
                            ? "pytanie"
                            : questionCount < 5
                              ? "pytania"
                              : "pytań"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}