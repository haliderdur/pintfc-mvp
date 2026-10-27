"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PrivacyPageError() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Alert data-testid="privacy-page-error" variant="destructive">
        <AlertDescription>Something went wrong loading privacy settings.</AlertDescription>
      </Alert>
    </main>
  );
}
