"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FixtureError() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Alert data-testid="fixture-error" variant="destructive">
        <AlertDescription>Something went wrong loading this fixture.</AlertDescription>
      </Alert>
    </main>
  );
}
