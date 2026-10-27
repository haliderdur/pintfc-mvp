"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

type ConsentField = "photoConsent" | "nationalityConsent" | "statsConsent";

const FIELDS: { field: ConsentField; label: string; key: "photo" | "nationality" | "stats" }[] = [
  { field: "photoConsent", label: "Show my photo", key: "photo" },
  { field: "nationalityConsent", label: "Show my nationality", key: "nationality" },
  { field: "statsConsent", label: "Show my stats", key: "stats" },
];

export function PrivacyForm({
  locked,
  initialConsents,
}: {
  locked: boolean;
  initialConsents: Record<ConsentField, boolean>;
}) {
  const [consents, setConsents] = useState(initialConsents);
  const [saving, setSaving] = useState<ConsentField | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(field: ConsentField, value: boolean) {
    setSaving(field);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (!res.ok) {
      setSaving(null);
      setError("Something went wrong saving that setting.");
      return;
    }

    setConsents((prev) => ({ ...prev, [field]: value }));
    setSaving(null);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {locked && (
        <Alert>
          <AlertDescription>
            You&apos;re under 18 and your guardian hasn&apos;t given consent yet, so these settings are locked off.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent className="flex flex-col gap-4">
          {FIELDS.map(({ field, label, key }) => (
            <div key={field} className="flex items-center justify-between gap-4">
              <Label htmlFor={`privacy-toggle-${key}`} className="font-normal">
                {label}
              </Label>
              <div className="flex items-center gap-2">
                {saving === field && <span className="text-xs text-muted-foreground">Saving…</span>}
                {locked ? (
                  <Switch
                    id={`privacy-toggle-${key}-locked`}
                    data-testid={`privacy-toggle-${key}-locked`}
                    checked={false}
                    disabled
                  />
                ) : (
                  <Switch
                    id={`privacy-toggle-${key}`}
                    data-testid={`privacy-toggle-${key}`}
                    checked={consents[field]}
                    disabled={saving === field}
                    onCheckedChange={(checked) => toggle(field, checked)}
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {saved && (
        <Alert data-testid="privacy-saved">
          <AlertDescription>Saved.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert data-testid="privacy-error" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
