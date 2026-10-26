import { describe, expect, it } from "vitest";
import { computeSeasonRecord } from "../../lib/season-record";

describe("AC-2.2.1 the season record is computed from published results only", () => {
  it("counts wins, draws and losses from PINT FC's perspective", () => {
    const record = computeSeasonRecord([
      { homeScore: 2, awayScore: 1, isPintFcHome: true }, // win
      { homeScore: 0, awayScore: 0, isPintFcHome: true }, // draw
      { homeScore: 3, awayScore: 2, isPintFcHome: false }, // loss (PINT FC away, 2-3)
      { homeScore: 1, awayScore: 1, isPintFcHome: false }, // draw
      { homeScore: 0, awayScore: 2, isPintFcHome: true }, // loss
    ]);

    expect(record).toEqual({ wins: 1, draws: 2, losses: 2 });
  });

  it("returns all zeros for an empty results array", () => {
    expect(computeSeasonRecord([])).toEqual({ wins: 0, draws: 0, losses: 0 });
  });
});
