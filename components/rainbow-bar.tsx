import { cn } from "@/lib/utils";

export function RainbowBar({ className }: { className?: string }) {
  return (
    <div className={cn("h-1.5 w-full rainbow-gradient", className)} />
  );
}