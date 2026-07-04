"use client";

import { createQuiz } from "@/lib/actions/quizzes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useActionState } from "react";

export function CreateQuizForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return createQuiz(formData);
    },
    null,
  );

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Nowy quiz</h1>
        <p className="text-muted-foreground mt-1">
          Podaj tytuł — pytania dodasz w kolejnym kroku
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          <form action={formAction} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="title">Tytuł quizu</Label>
              <Input
                id="title"
                name="title"
                placeholder="np. Quiz z geografii"
                required
                maxLength={100}
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <div className="flex gap-3">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Tworzenie..." : "Utwórz quiz"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/">Anuluj</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}