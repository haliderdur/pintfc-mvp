"use client";

import { useState } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import type { FixtureSummary, RsvpAnswer } from "@/lib/fixtures/get-summary";

const POLL_INTERVAL_MS = 10_000;

export function FixtureRsvpPanel({
  matchId,
  isSignedIn,
  initialSummary,
}: {
  matchId: string;
  isSignedIn: boolean;
  initialSummary: FixtureSummary;
}) {
  const { data: polled, refetch } = usePolling<FixtureSummary>(
    `/api/fixtures/${matchId}/summary`,
    POLL_INTERVAL_MS
  );
  const summary = polled ?? initialSummary;
  const [submitting, setSubmitting] = useState(false);

  async function rsvp(answer: RsvpAnswer) {
    setSubmitting(true);
    const res = await fetch(`/api/fixtures/${matchId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (res.ok) {
      await refetch();
    }
    setSubmitting(false);
  }

  return (
    <div>
      <div data-testid="fixture-count-going">Going: {summary.going}</div>
      <div data-testid="fixture-count-maybe">Maybe: {summary.maybe}</div>
      <div data-testid="fixture-count-not-going">Not going: {summary.notGoing}</div>

      {isSignedIn && summary.roster && (
        <ul data-testid="fixture-roster">
          {summary.roster.map((entry) => (
            <li key={entry.playerId}>
              {entry.fullName}: {entry.answer}
            </li>
          ))}
        </ul>
      )}

      {isSignedIn && summary.isOpen && (
        <div>
          <button data-testid="fixture-rsvp-going" disabled={submitting} onClick={() => rsvp("going")}>
            Going
          </button>
          <button data-testid="fixture-rsvp-maybe" disabled={submitting} onClick={() => rsvp("maybe")}>
            Maybe
          </button>
          <button data-testid="fixture-rsvp-not-going" disabled={submitting} onClick={() => rsvp("not_going")}>
            Not going
          </button>
        </div>
      )}

      {isSignedIn && !summary.isOpen && (
        <button data-testid="fixture-rsvp-closed" disabled>
          RSVP closed
        </button>
      )}
    </div>
  );
}
