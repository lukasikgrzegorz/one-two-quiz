"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return { supabase, user };
}

export async function requireQuizOwnership(quizId: string) {
  const { supabase, user } = await requireUser();

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, title, status, points_per_correct")
    .eq("id", quizId)
    .eq("created_by", user.id)
    .single();

  if (error || !quiz) {
    redirect("/");
  }

  return { supabase, user, quiz };
}