import { isRsvpOpen, type MatchCutoff } from "./cutoff";

export interface ViewerPlayer {
  isArchived: boolean;
}

// A viewer may RSVP only if they are a signed-in, non-archived player
// and the match's cutoff hasn't passed.
export function canRsvp(viewerPlayer: ViewerPlayer | null, match: MatchCutoff, now?: Date): boolean {
  if (!viewerPlayer || viewerPlayer.isArchived) return false;
  return isRsvpOpen(match, now);
}
