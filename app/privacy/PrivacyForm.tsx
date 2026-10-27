"use client";

import { useState } from "react";

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
    <div>
      {locked && (
        <p>
          You&apos;re under 18 and your guardian hasn&apos;t given consent yet, so these settings are locked off.
        </p>
      )}
      <ul>
        {FIELDS.map(({ field, label, key }) => (
          <li key={field}>
            <label>
              {locked ? (
                <input
                  type="checkbox"
                  data-testid={`privacy-toggle-${key}-locked`}
                  checked={false}
                  disabled
                  readOnly
                />
              ) : (
                <input
                  type="checkbox"
                  data-testid={`privacy-toggle-${key}`}
                  checked={consents[field]}
                  disabled={saving === field}
                  onChange={(e) => toggle(field, e.target.checked)}
                />
              )}
              {label}
            </label>
            {saving === field && <span>Saving…</span>}
          </li>
        ))}
      </ul>
      {saved && <p data-testid="privacy-saved">Saved.</p>}
      {error && <p data-testid="privacy-error">{error}</p>}
    </div>
  );
}
