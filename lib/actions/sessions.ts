"use server";

import { requireQuizOwnership } from "./auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireSessionOwnership(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: session, error } = await supabase
    .from("game_sessions")
    .select("id, quiz_id, room_code, status, current_question_index, phase, started_at, question_started_at")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    redirect("/");
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, created_by, status")
    .eq("id", session.quiz_id)
    .single();

  if (!quiz || quiz.created_by !== user.id) {
    redirect("/");
  }

  return { supabase, user, session, quiz };
}

export async function createSession(
  quizId: string,
): Promise<{ sessionId?: string; error?: string }> {
  const { supabase, quiz } = await requireQuizOwnership(quizId);

  if (quiz.status !== "approved") {
    return { error: "Quiz musi być zatwierdzony przed uruchomieniem gry" };
  }

  const { error: validateError } = await supabase.rpc("validate_quiz_ready", {
    p_quiz_id: quizId,
  });

  if (validateError) {
    return { error: validateError.message };
  }

  const { data: roomCode, error: codeError } =
    await supabase.rpc("generate_room_code");

  if (codeError || !roomCode) {
    return { error: codeError?.message ?? "Nie udało się wygenerować kodu" };
  }

  const { data: session, error } = await supabase
    .from("game_sessions")
    .insert({
      quiz_id: quizId,
      room_code: roomCode,
      status: "lobby",
    })
    .select("id")
    .single();

  if (error || !session) {
    return { error: error?.message ?? "Nie udało się utworzyć sesji" };
  }

  return { sessionId: session.id };
}

export async function startGame(
  sessionId: string,
): Promise<{ error?: string }> {
  const { supabase, session } = await requireSessionOwnership(sessionId);

  if (session.status !== "lobby") {
    return { error: "Gra została już rozpoczęta" };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("game_sessions")
    .update({
      status: "active",
      phase: "question",
      current_question_index: 0,
      started_at: now,
      question_started_at: now,
    })
    .eq("id", sessionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/host/${sessionId}`);
  return {};
}

export async function advanceGame(
  sessionId: string,
): Promise<{ error?: string }> {
  const { supabase, session } = await requireSessionOwnership(sessionId);

  if (session.status !== "active" || !session.phase) {
    return {};
  }

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", session.quiz_id);

  const totalQuestions = count ?? 0;
  const now = new Date().toISOString();

  if (session.phase === "question") {
    const { error } = await supabase
      .from("game_sessions")
      .update({ phase: "answers", question_started_at: now })
      .eq("id", sessionId)
      .eq("phase", "question");

    if (error) return { error: error.message };
  } else if (session.phase === "answers") {
    const { error } = await supabase
      .from("game_sessions")
      .update({ phase: "reveal", question_started_at: now })
      .eq("id", sessionId)
      .eq("phase", "answers");

    if (error) return { error: error.message };
  } else if (session.phase === "reveal") {
    const { error } = await supabase
      .from("game_sessions")
      .update({ phase: "leaderboard", question_started_at: now })
      .eq("id", sessionId)
      .eq("phase", "reveal");

    if (error) return { error: error.message };
  } else if (session.phase === "leaderboard") {
    if (session.current_question_index + 1 >= totalQuestions) {
      const { error } = await supabase
        .from("game_sessions")
        .update({
          status: "finished",
          phase: null,
          question_started_at: null,
        })
        .eq("id", sessionId)
        .eq("phase", "leaderboard");

      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("game_sessions")
        .update({
          current_question_index: session.current_question_index + 1,
          phase: "question",
          question_started_at: now,
        })
        .eq("id", sessionId)
        .eq("phase", "leaderboard");

      if (error) return { error: error.message };
    }
  }

  revalidatePath(`/host/${sessionId}`);
  return {};
}