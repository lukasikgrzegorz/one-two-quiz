"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireQuizOwnership, requireUser } from "./auth";

export async function createQuiz(formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = (formData.get("title") as string)?.trim();

  if (!title) {
    return { error: "Tytuł quizu jest wymagany" };
  }

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      title,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Nie udało się utworzyć quizu" };
  }

  revalidatePath("/");
  redirect(`/admin/quizzes/${data.id}`);
}

export async function approveQuiz(
  quizId: string,
): Promise<{ error?: string }> {
  const { supabase } = await requireQuizOwnership(quizId);

  const { error: validateError } = await supabase.rpc("validate_quiz_ready", {
    p_quiz_id: quizId,
  });

  if (validateError) {
    return { error: validateError.message };
  }

  const { error } = await supabase
    .from("quizzes")
    .update({ status: "approved" })
    .eq("id", quizId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath("/");
  return {};
}

export async function unapproveQuiz(
  quizId: string,
): Promise<{ error?: string }> {
  const { supabase } = await requireQuizOwnership(quizId);

  const { error } = await supabase
    .from("quizzes")
    .update({ status: "draft" })
    .eq("id", quizId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath("/");
  return {};
}