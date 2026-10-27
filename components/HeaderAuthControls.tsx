"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function HeaderAuthControls({ fullName }: { fullName: string }) {
  const router = useRouter();

  async function signOut(scope: "self" | "all") {
    await fetch(scope === "all" ? "/api/auth/sign-out-all" : "/api/auth/sign-out", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="ghost" size="sm" render={<a href="/privacy">Privacy</a>} />
      <span className="hidden text-sm text-muted-foreground sm:inline">{fullName}</span>
      <Button data-testid="header-signout" variant="outline" size="sm" onClick={() => signOut("self")}>
        Sign out
      </Button>
      <Button data-testid="header-signout-all" variant="ghost" size="sm" onClick={() => signOut("all")}>
        Sign out everywhere
      </Button>
    </div>
  );
}
