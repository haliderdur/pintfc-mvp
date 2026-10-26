// Mirrors the `public_profile` SQL view's filtering logic in TypeScript,
// so UI code (e.g. "why is this field hidden" messaging) matches the
// database exactly and the rule can be unit-tested without a database.
// dob/email/phone/RSVP answer are never part of this type — they are
// never public, full stop (AC-4.3.1), not something this function toggles.

export interface PlayerCore {
  isMinor: boolean;
  guardianConsent: boolean;
  isArchived: boolean;
}

export interface Consents {
  photoConsent: boolean;
  nationalityConsent: boolean;
  statsConsent: boolean;
}

export interface VisibleFields {
  fullName: true;
  squadNumber: true;
  position: true;
  photoUrl: boolean;
  nationality: boolean;
  statsVisible: boolean;
}

export function visiblePlayerFields(
  player: PlayerCore,
  consents: Consents,
  viewerIsSelf: boolean
): VisibleFields {
  if (viewerIsSelf) {
    return {
      fullName: true,
      squadNumber: true,
      position: true,
      photoUrl: true,
      nationality: true,
      statsVisible: true,
    };
  }

  // A minor without guardian consent gets opt-in fields forced hidden,
  // even if their own consent flags are individually true (AC-4.2.2).
  const minorLocked = player.isMinor && !player.guardianConsent;

  return {
    fullName: true,
    squadNumber: true,
    position: true,
    photoUrl: !minorLocked && consents.photoConsent,
    nationality: !minorLocked && consents.nationalityConsent,
    statsVisible: !minorLocked && consents.statsConsent,
  };
}

// Turning a consent field off is always allowed; turning one on is
// blocked for a minor without guardian consent (AC-4.3.4).
export function canEditOwnConsent(player: PlayerCore, turningOn: boolean): boolean {
  if (!turningOn) return true;
  return !(player.isMinor && !player.guardianConsent);
}
