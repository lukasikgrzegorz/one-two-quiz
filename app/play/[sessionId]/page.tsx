import { AppFooter } from "@/components/app-footer";
import { AppTopBar } from "@/components/app-top-bar";
import { Suspense } from "react";
import { PlayPageClient } from "./play-page-client";

export default function PlayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <AppTopBar />
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6">
        <Suspense>
          <PlayPageWrapper params={params} />
        </Suspense>
      </div>
      <AppFooter />
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