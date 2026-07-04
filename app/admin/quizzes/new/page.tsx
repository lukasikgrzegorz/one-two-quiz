import { CreateQuizForm } from "@/components/create-quiz-form";
import { HomeHeader } from "@/components/home-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function NewQuizContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  return <CreateQuizForm />;
}

export default function NewQuizPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <HomeHeader />
      <div className="flex-1 flex items-center justify-center p-5 py-16">
        <Suspense>
          <NewQuizContent />
        </Suspense>
      </div>
    </main>
  );
}