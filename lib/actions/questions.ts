"use server";

import { revalidatePath } from "next/cache";
import { requireQuizOwnership } from "./auth";

type ActionResult = { error?: string };

const DEFAULT_QUESTION_SECONDS = 10;
const DEFAULT_ANSWER_COLLECTION_SECONDS = 15;
const DEFAULT_ANSWER_REVEAL_SECONDS = 5;

type ParsedTiming =
  | { error: string }
  | {
      questionDisplaySeconds: number;
      answerCollectionSeconds: number;
      answerDisplaySeconds: number;
    };

function parseTiming(formData: FormData): ParsedTiming {
  const questionDisplay = Number(
    formData.get("question_display_seconds") ?? DEFAULT_QUESTION_SECONDS,
  );
  const answerCollection = Number(
    formData.get("answer_collection_seconds") ??
      DEFAULT_ANSWER_COLLECTION_SECONDS,
  );
  const answerDisplay = Number(
    formData.get("answer_display_seconds") ?? DEFAULT_ANSWER_REVEAL_SECONDS,
  );

  if (
    !Number.isInteger(questionDisplay) ||
    questionDisplay < 1 ||
    questionDisplay > 300
  ) {
    return { error: "Czas na pytanie musi być od 1 do 300 sekund" };
  }

  if (
    !Number.isInteger(answerCollection) ||
    answerCollection < 1 ||
    answerCollection > 120
  ) {
    return { error: "Czas na wybór odpowiedzi musi być od 1 do 120 sekund" };
  }

  if (
    !Number.isInteger(answerDisplay) ||
    answerDisplay < 1 ||
    answerDisplay > 120
  ) {
    return { error: "Czas na wynik musi być od 1 do 120 sekund" };
  }

  return {
    questionDisplaySeconds: questionDisplay,
    answerCollectionSeconds: answerCollection,
    answerDisplaySeconds: answerDisplay,
  };
}

function parseAnswers(formData: FormData) {
  const answers: { text: string; isCorrect: boolean }[] = [];

  for (let i = 0; i < 4; i++) {
    const text = (formData.get(`answer_${i}`) as string)?.trim();
    if (text) {
      answers.push({
        text,
        isCorrect: formData.get("correct_index") === String(i),
      });
    }
  }

  return answers;
}

async function markQuizAsDraft(
  supabase: Awaited<
    ReturnType<typeof import("./auth").requireQuizOwnership>
  >["supabase"],
  quizId: string,
) {
  await supabase
    .from("quizzes")
    .update({ status: "draft" })
    .eq("id", quizId)
    .eq("status", "approved");
}

export async function addQuestion(
  quizId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireQuizOwnership(quizId);

  const text = (formData.get("question_text") as string)?.trim();
  const timing = parseTiming(formData);
  if ("error" in timing) return { error: timing.error };

  const answers = parseAnswers(formData);
  const correctCount = answers.filter((a) => a.isCorrect).length;

  if (!text) {
    return { error: "Treść pytania jest wymagana" };
  }

  if (answers.length < 2 || answers.length > 4) {
    return { error: "Pytanie musi mieć od 2 do 4 odpowiedzi" };
  }

  if (correctCount !== 1) {
    return { error: "Wybierz dokładnie jedną poprawną odpowiedź" };
  }

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", quizId);

  const orderIndex = count ?? 0;

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      quiz_id: quizId,
      text,
      order_index: orderIndex,
      question_display_seconds: timing.questionDisplaySeconds,
      answer_collection_seconds: timing.answerCollectionSeconds,
      answer_display_seconds: timing.answerDisplaySeconds,
    })
    .select("id")
    .single();

  if (questionError || !question) {
    return { error: questionError?.message ?? "Nie udało się dodać pytania" };
  }

  const { error: answersError } = await supabase.from("answers").insert(
    answers.map((answer, index) => ({
      question_id: question.id,
      text: answer.text,
      is_correct: answer.isCorrect,
      order_index: index,
    })),
  );

  if (answersError) {
    await supabase.from("questions").delete().eq("id", question.id);
    return { error: answersError.message };
  }

  await markQuizAsDraft(supabase, quizId);

  revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath("/");
  return {};
}

export async function deleteQuestion(
  quizId: string,
  questionId: string,
): Promise<ActionResult> {
  const { supabase } = await requireQuizOwnership(quizId);

  const { data: question } = await supabase
    .from("questions")
    .select("id, order_index")
    .eq("id", questionId)
    .eq("quiz_id", quizId)
    .single();

  if (!question) {
    return { error: "Nie znaleziono pytania" };
  }

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    return { error: error.message };
  }

  const { data: remaining } = await supabase
    .from("questions")
    .select("id, order_index")
    .eq("quiz_id", quizId)
    .order("order_index");

  if (remaining) {
    await Promise.all(
      remaining.map((q, index) =>
        supabase
          .from("questions")
          .update({ order_index: index })
          .eq("id", q.id),
      ),
    );
  }

  await markQuizAsDraft(supabase, quizId);

  revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath("/");
  return {};
}

export async function updateQuestion(
  quizId: string,
  questionId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireQuizOwnership(quizId);

  const text = (formData.get("question_text") as string)?.trim();
  const timing = parseTiming(formData);
  if ("error" in timing) return { error: timing.error };

  const answers = parseAnswers(formData);
  const correctCount = answers.filter((a) => a.isCorrect).length;

  if (!text) {
    return { error: "Treść pytania jest wymagana" };
  }

  if (answers.length < 2 || answers.length > 4) {
    return { error: "Pytanie musi mieć od 2 do 4 odpowiedzi" };
  }

  if (correctCount !== 1) {
    return { error: "Wybierz dokładnie jedną poprawną odpowiedź" };
  }

  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("id", questionId)
    .eq("quiz_id", quizId)
    .single();

  if (!question) {
    return { error: "Nie znaleziono pytania" };
  }

  const { error: questionError } = await supabase
    .from("questions")
    .update({
      text,
      question_display_seconds: timing.questionDisplaySeconds,
      answer_collection_seconds: timing.answerCollectionSeconds,
      answer_display_seconds: timing.answerDisplaySeconds,
    })
    .eq("id", questionId);

  if (questionError) {
    return { error: questionError.message };
  }

  const { error: deleteError } = await supabase
    .from("answers")
    .delete()
    .eq("question_id", questionId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const { error: answersError } = await supabase.from("answers").insert(
    answers.map((answer, index) => ({
      question_id: questionId,
      text: answer.text,
      is_correct: answer.isCorrect,
      order_index: index,
    })),
  );

  if (answersError) {
    return { error: answersError.message };
  }

  await markQuizAsDraft(supabase, quizId);

  revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath("/");
  return {};
}