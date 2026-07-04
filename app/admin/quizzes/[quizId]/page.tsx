import { HomeHeader } from "@/components/home-header";
import { QuizEditor } from "@/components/quiz-editor";
import { Suspense } from "react";

export default function QuizEditPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <HomeHeader />
      <div className="flex-1 p-5 py-10">
        <Suspense>
          <QuizEditContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function QuizEditContent({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return <QuizEditor quizId={quizId} />;
}