"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SquadError() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Alert data-testid="squad-error" variant="destructive">
        <AlertDescription>Something went wrong loading the squad.</AlertDescription>
      </Alert>
    </main>
  );
}
