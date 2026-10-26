"use client";

import { useRouter } from "next/navigation";

export function HeaderAuthControls({ fullName }: { fullName: string }) {
  const router = useRouter();

  async function signOut(scope: "self" | "all") {
    await fetch(scope === "all" ? "/api/auth/sign-out-all" : "/api/auth/sign-out", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div>
      <span>{fullName}</span>
      <button data-testid="header-signout" onClick={() => signOut("self")}>
        Sign out
      </button>
      <button data-testid="header-signout-all" onClick={() => signOut("all")}>
        Sign out everywhere
      </button>
    </div>
  );
}
