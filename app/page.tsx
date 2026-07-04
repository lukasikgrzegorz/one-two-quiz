import { AdminDashboard } from "@/components/admin-dashboard";
import { HomeHeader } from "@/components/home-header";
import { JoinSessionForm } from "@/components/join-session-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { Suspense } from "react";

async function HomeContent() {
  if (!hasEnvVars) {
    return <JoinSessionForm />;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return data?.claims ? <AdminDashboard /> : <JoinSessionForm />;
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <HomeHeader />

      <div className="flex-1 flex flex-col items-center justify-center p-5 py-16">
        <Suspense fallback={<JoinSessionForm />}>
          <HomeContent />
        </Suspense>
      </div>

      <footer className="w-full flex items-center justify-center border-t text-center text-xs gap-8 py-8">
        <ThemeSwitcher />
      </footer>
    </main>
  );
}