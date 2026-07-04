import { AdminDashboard } from "@/components/admin-dashboard";
import { AppFooter } from "@/components/app-footer";
import { HomeHeader } from "@/components/home-header";
import { JoinSessionForm } from "@/components/join-session-form";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { Suspense } from "react";

function CenteredJoinForm() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5 py-16">
      <JoinSessionForm />
    </div>
  );
}

function HomeLoadingFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5 py-16">
      <p className="text-muted-foreground">Ładowanie...</p>
    </div>
  );
}

async function HomeContent() {
  if (!hasEnvVars) {
    return <CenteredJoinForm />;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    return (
      <div className="w-full flex justify-center p-5 px-5 pt-8 pb-16">
        <div className="w-full max-w-5xl">
          <AdminDashboard />
        </div>
      </div>
    );
  }

  return <CenteredJoinForm />;
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <HomeHeader />

      <Suspense fallback={<HomeLoadingFallback />}>
        <HomeContent />
      </Suspense>

      <AppFooter />
    </main>
  );
}