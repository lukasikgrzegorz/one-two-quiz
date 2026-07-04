import { HomeHeader } from "@/components/home-header";
import { HostSessionView } from "@/components/host-session-view";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function HostSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <HomeHeader />
      <div className="flex-1 flex items-center justify-center p-5 py-10">
        <Suspense>
          <HostPageContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function HostPageContent({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: session } = await supabase
    .from("game_sessions")
    .select("id, quiz_id")
    .eq("id", sessionId)
    .single();

  if (!session) {
    redirect("/");
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, created_by")
    .eq("id", session.quiz_id)
    .single();

  if (!quiz || quiz.created_by !== user.id) {
    redirect("/");
  }

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", quiz.id);

  return (
    <HostSessionView
      sessionId={sessionId}
      quizTitle={quiz.title}
      totalQuestions={count ?? 0}
    />
  );
}