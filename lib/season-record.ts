export type SeasonRecord = {
  wins: number;
  draws: number;
  losses: number;
};

export type MatchResultForRecord = {
  homeScore: number;
  awayScore: number;
  isPintFcHome: boolean;
};

export function computeSeasonRecord(results: MatchResultForRecord[]): SeasonRecord {
  const record: SeasonRecord = { wins: 0, draws: 0, losses: 0 };

  for (const result of results) {
    const pintFcScore = result.isPintFcHome ? result.homeScore : result.awayScore;
    const opponentScore = result.isPintFcHome ? result.awayScore : result.homeScore;

    if (pintFcScore > opponentScore) record.wins += 1;
    else if (pintFcScore === opponentScore) record.draws += 1;
    else record.losses += 1;
  }

  return record;
}
