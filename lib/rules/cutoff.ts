// Source of truth for "is RSVP still open" — mirrors the RLS policy on
// `rsvps` (now() < matches.rsvp_cutoff_at). Never trust a client-supplied
// "current time"; `now` is only a parameter so tests can fix the clock.
export interface MatchCutoff {
  rsvpCutoffAt: string | Date;
}

export function isRsvpOpen(match: MatchCutoff, now: Date = new Date()): boolean {
  return now.getTime() < new Date(match.rsvpCutoffAt).getTime();
}
