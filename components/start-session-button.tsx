"use client";

import { createSession } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartSessionButton({
  quizId,
  size = "default",
}: {
  quizId: string;
  size?: "default" | "sm";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleStart = async () => {
    setIsPending(true);
    setError(null);

    try {
      const result = await createSession(quizId);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.sessionId) {
        router.push(`/host/${result.sessionId}`);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size={size}
        onClick={handleStart}
        disabled={isPending}
      >
        <Play className="mr-2 h-4 w-4" />
        {isPending ? "Tworzenie..." : "Uruchom grę"}
      </Button>
      {error && (
        <p className="text-xs text-destructive max-w-[160px]">{error}</p>
      )}
    </div>
  );
}