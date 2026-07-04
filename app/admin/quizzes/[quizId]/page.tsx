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
      <div className="flex-1 w-full p-5 px-5 pt-8 pb-16">
        <div className="w-full max-w-5xl mx-auto">
          <Suspense>
            <QuizEditContent params={params} />
          </Suspense>
        </div>
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