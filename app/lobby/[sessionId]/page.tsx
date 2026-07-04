import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";

async function LobbyContent({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Lobby</CardTitle>
        <CardDescription>
          Czekasz na start gry. Host wkrótce rozpocznie quiz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground font-mono">
          Sesja: {sessionId.slice(0, 8)}…
        </p>
      </CardContent>
    </Card>
  );
}

export default function LobbyPage({
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
      <div className="flex-1 flex items-center justify-center p-5 py-16">
        <Suspense>
          <LobbyContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}