"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PlayerProfileError() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Alert data-testid="profile-error" variant="destructive">
        <AlertDescription>Something went wrong loading this profile.</AlertDescription>
      </Alert>
    </main>
  );
}
