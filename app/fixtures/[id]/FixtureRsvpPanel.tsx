"use client";

import { useState } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import type { FixtureSummary, RsvpAnswer } from "@/lib/fixtures/get-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Badge variant="secondary" data-testid="fixture-count-going" className="text-sm">
          Going: {summary.going}
        </Badge>
        <Badge variant="secondary" data-testid="fixture-count-maybe" className="text-sm">
          Maybe: {summary.maybe}
        </Badge>
        <Badge variant="secondary" data-testid="fixture-count-not-going" className="text-sm">
          Not going: {summary.notGoing}
        </Badge>
      </div>

      {isSignedIn && summary.roster && (
        <Card>
          <CardContent>
            <ul data-testid="fixture-roster" className="flex flex-col gap-2">
              {summary.roster.map((entry) => (
                <li key={entry.playerId} className="flex items-center justify-between text-sm">
                  <span>{entry.fullName}</span>
                  <Badge variant="outline">{entry.answer}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isSignedIn && summary.isOpen && (
        <div className="flex flex-wrap gap-2">
          <Button data-testid="fixture-rsvp-going" disabled={submitting} onClick={() => rsvp("going")}>
            Going
          </Button>
          <Button
            data-testid="fixture-rsvp-maybe"
            variant="secondary"
            disabled={submitting}
            onClick={() => rsvp("maybe")}
          >
            Maybe
          </Button>
          <Button
            data-testid="fixture-rsvp-not-going"
            variant="outline"
            disabled={submitting}
            onClick={() => rsvp("not_going")}
          >
            Not going
          </Button>
        </div>
      )}

      {isSignedIn && !summary.isOpen && (
        <Button data-testid="fixture-rsvp-closed" disabled variant="outline" className="w-fit">
          RSVP closed
        </Button>
      )}
    </div>
  );
}
