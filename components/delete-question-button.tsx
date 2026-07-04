"use client";

import { deleteQuestion } from "@/lib/actions/questions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteQuestionButton({
  quizId,
  questionId,
}: {
  quizId: string;
  questionId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Usunąć to pytanie?")) return;

    setIsDeleting(true);
    const result = await deleteQuestion(quizId, questionId);

    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
      return;
    }

    router.refresh();
    setIsDeleting(false);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}