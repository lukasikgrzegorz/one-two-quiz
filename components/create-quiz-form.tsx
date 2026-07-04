"use client";

import { createQuiz } from "@/lib/actions/quizzes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Nowy quiz</CardTitle>
        <CardDescription>
          Podaj tytuł — pytania dodasz w kolejnym kroku
        </CardDescription>
      </CardHeader>
      <CardContent>
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
  );
}