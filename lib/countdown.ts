export type CountdownState = {
  hasStarted: boolean;
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getCountdownState(kickoffAt: string | Date, now: Date = new Date()): CountdownState {
  const kickoff = typeof kickoffAt === "string" ? new Date(kickoffAt) : kickoffAt;
  const remainingMs = kickoff.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return { hasStarted: true, totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hasStarted: false, totalSeconds, days, hours, minutes, seconds };
}
