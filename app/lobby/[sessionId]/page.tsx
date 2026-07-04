import { AppFooter } from "@/components/app-footer";
import { AppTopBar } from "@/components/app-top-bar";
import { Suspense } from "react";
import { LobbyPageClient } from "./lobby-page-client";

export default function LobbyPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <AppTopBar />
      <div className="flex-1 flex items-center justify-center p-5 py-16">
        <Suspense>
          <LobbyPageContent params={params} />
        </Suspense>
      </div>
      <AppFooter />
    </main>
  );
}

async function LobbyPageContent({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <LobbyPageClient sessionId={sessionId} />;
}