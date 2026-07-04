import { AppLogo } from "@/components/app-logo";
import { RainbowBar } from "@/components/rainbow-bar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export function AppTopBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <Link href="/">
            <AppLogo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            {children}
            <ThemeSwitcher />
          </div>
        </div>
      </nav>
      <RainbowBar />
    </header>
  );
}