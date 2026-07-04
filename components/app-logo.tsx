import { cn } from "@/lib/utils";

const sizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
} as const;

export function AppLogo({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline leading-none tracking-tight",
        sizes[size],
        className,
      )}
    >
      <span className="font-rasp italic text-[1.55em] -mr-0.5">Rasp</span>
      <span className="font-dwa font-normal">dwa</span>
      <span className="font-quiz font-bold uppercase">QUIZ</span>
    </span>
  );
}