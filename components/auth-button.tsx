import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground hidden sm:inline">
        {user.email}
      </span>
      <LogoutButton />
    </div>
  );
}
