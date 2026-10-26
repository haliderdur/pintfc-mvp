"use client";

import { useEffect, useState } from "react";
import { getCountdownState } from "@/lib/countdown";

export function NextMatchCountdown({ kickoffAt }: { kickoffAt: string }) {
  const [state, setState] = useState(() => getCountdownState(kickoffAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getCountdownState(kickoffAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [kickoffAt]);

  if (state.hasStarted) {
    return <span data-testid="home-countdown">Match started</span>;
  }

  return (
    <span data-testid="home-countdown">
      {state.days}d {state.hours}h {state.minutes}m {state.seconds}s
    </span>
  );
}
