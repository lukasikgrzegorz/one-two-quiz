import Link from "next/link";
import { Suspense } from "react";
import { PlayPageClient } from "./play-page-client";

export default function PlayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <Link href="/" className="font-semibold text-lg">
            One Two Quiz
          </Link>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center p-5 py-10">
        <Suspense>
          <PlayPageWrapper params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function PlayPageWrapper({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <PlayPageClient sessionId={sessionId} />;
}