import { describe, expect, it } from "vitest";
import { getCountdownState } from "../../lib/countdown";

describe("AC-2.1.6 the countdown shows a started/passed state instead of a negative value at zero", () => {
  it("counts down while kickoff is in the future", () => {
    const now = new Date("2026-01-01T10:00:00Z");
    const kickoff = new Date("2026-01-02T12:30:10Z");
    const state = getCountdownState(kickoff, now);

    expect(state.hasStarted).toBe(false);
    expect(state.totalSeconds).toBe(26 * 60 * 60 + 30 * 60 + 10);
    expect(state.days).toBe(1);
    expect(state.hours).toBe(2);
    expect(state.minutes).toBe(30);
    expect(state.seconds).toBe(10);
  });

  it("reports started/passed exactly at kickoff, with no negative values", () => {
    const now = new Date("2026-01-01T10:00:00Z");
    const state = getCountdownState(now, now);

    expect(state.hasStarted).toBe(true);
    expect(state.totalSeconds).toBe(0);
    expect(state.days).toBe(0);
    expect(state.hours).toBe(0);
    expect(state.minutes).toBe(0);
    expect(state.seconds).toBe(0);
  });

  it("reports started/passed once kickoff is in the past, with no negative values", () => {
    const now = new Date("2026-01-01T10:00:05Z");
    const kickoff = new Date("2026-01-01T10:00:00Z");
    const state = getCountdownState(kickoff, now);

    expect(state.hasStarted).toBe(true);
    expect(state.totalSeconds).toBe(0);
    expect(state.days).toBe(0);
    expect(state.hours).toBe(0);
    expect(state.minutes).toBe(0);
    expect(state.seconds).toBe(0);
  });

  it("accepts an ISO string kickoff", () => {
    const now = new Date("2026-01-01T10:00:00Z");
    const state = getCountdownState("2026-01-01T11:00:00Z", now);

    expect(state.hasStarted).toBe(false);
    expect(state.hours).toBe(1);
  });
});
