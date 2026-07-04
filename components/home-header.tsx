import { AppTopBar } from "@/components/app-top-bar";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { Suspense } from "react";

export function HomeHeader() {
  return (
    <AppTopBar>
      {!hasEnvVars ? (
        <EnvVarWarning />
      ) : (
        <Suspense>
          <AuthButton />
        </Suspense>
      )}
    </AppTopBar>
  );
}