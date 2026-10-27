"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <Alert data-testid="home-error" variant="destructive">
        <AlertDescription>Something went wrong. Please try again.</AlertDescription>
      </Alert>
      <Button variant="outline" className="w-fit" onClick={reset}>
        Retry
      </Button>
    </main>
  );
}
