import { Match, Player, PlayerStats, RankChange, RankingEntry, SetScore, WeekMVP } from '@/types';

/**
 * Calculate total points for a team in a match.
 * Win = 10 pts + all games won. Loss = 2 pts + all games won.
 */
export function calculateTeamPoints(
  sets: SetScore[],
  isTeam1: boolean,
  isWinner: boolean,
): number {
  const matchPoints = isWinner ? 10 : 2;
  const gamesWon = sets.reduce((sum, set) => sum + (isTeam1 ? set.team1 : set.team2), 0);
  return matchPoints + gamesWon;
}

/**
 * Compute cumulative stats for a single player across all provided matches.
 */
export function computePlayerStats(playerId: string, matches: Match[]): PlayerStats {
  let totalPoints = 0;
  let matchesPlayed = 0;
  let wins = 0;
  let losses = 0;
  let gamesWon = 0;
  let gamesLost = 0;

  for (const match of matches) {
    const inTeam1 = match.team1.includes(playerId);
    const inTeam2 = match.team2.includes(playerId);

    if (!inTeam1 && !inTeam2) continue;

    matchesPlayed += 1;

    const isTeam1 = inTeam1;
    const isWinner = isTeam1 ? match.winnerTeam === 1 : match.winnerTeam === 2;

    if (isWinner) {
      wins += 1;
    } else {
      losses += 1;
    }

    const playerGamesWon = match.sets.reduce(
      (sum, set) => sum + (isTeam1 ? set.team1 : set.team2),
      0,
    );
    const playerGamesLost = match.sets.reduce(
      (sum, set) => sum + (isTeam1 ? set.team2 : set.team1),
      0,
    );

    gamesWon += playerGamesWon;
    gamesLost += playerGamesLost;
    totalPoints += calculateTeamPoints(match.sets, isTeam1, isWinner);
  }

  return {
    playerId,
    totalPoints,
    matchesPlayed,
    wins,
    losses,
    gamesWon,
    gamesLost,
  };
}

/**
 * Sort player stats by totalPoints DESC, then wins DESC, then gamesWon DESC.
 */
export function sortRankings(stats: PlayerStats[]): PlayerStats[] {
  return [...stats].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.gamesWon - a.gamesWon;
  });
}

/**
 * Compute full ranking entries for all players, including rank change vs previous week.
 *
 * @param players       All players in the league
 * @param allMatches    All matches ever played (current rankings)
 * @param previousWeekMatches  All matches played BEFORE the current week started (previous rankings)
 */
export function computeRankings(
  players: Player[],
  allMatches: Match[],
  previousWeekMatches: Match[],
): RankingEntry[] {
  // Current stats & rankings
  const currentStats = players.map((p) => computePlayerStats(p.id, allMatches));
  const sortedCurrent = sortRankings(currentStats);

  const currentRankMap = new Map<string, number>();
  sortedCurrent.forEach((stats, index) => {
    currentRankMap.set(stats.playerId, index + 1);
  });

  // Previous stats & rankings
  const previousStats = players.map((p) => computePlayerStats(p.id, previousWeekMatches));
  const sortedPrevious = sortRankings(previousStats);

  const previousRankMap = new Map<string, number>();
  sortedPrevious.forEach((stats, index) => {
    previousRankMap.set(stats.playerId, index + 1);
  });

  // Build ranking entries
  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

  return sortedCurrent.map((stats) => {
    const currentRank = currentRankMap.get(stats.playerId) ?? 0;
    const prevRank = previousRankMap.get(stats.playerId) ?? null;

    let rankChange: RankChange = 'same';
    if (prevRank !== null) {
      if (currentRank < prevRank) {
        rankChange = 'up';
      } else if (currentRank > prevRank) {
        rankChange = 'down';
      }
    }

    return {
      player: playerMap.get(stats.playerId)!,
      stats,
      rank: currentRank,
      previousRank: prevRank,
      rankChange,
    };
  });
}

/**
 * Returns the start (Sunday 00:00:00) and end (Thursday 23:59:59) of the current week.
 * The Saudi calendar week runs Sunday–Thursday.
 */
export function getCurrentWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Days since the most recent Sunday
  // Sunday=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  const daysSinceSunday = dayOfWeek;

  const start = new Date(now);
  start.setDate(now.getDate() - daysSinceSunday);
  start.setHours(0, 0, 0, 0);

  // Thursday is Sunday + 4 days
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Compute the MVP for the given week (player with most points in weekMatches).
 * Returns null if there are no matches.
 */
export function computeWeekMVP(
  players: Player[],
  weekMatches: Match[],
  weekStart: Date,
  weekEnd: Date,
): WeekMVP | null {
  if (weekMatches.length === 0) return null;

  const statsInWeek = players.map((p) => computePlayerStats(p.id, weekMatches));
  const sorted = sortRankings(statsInWeek);

  const topStats = sorted[0];
  if (topStats.matchesPlayed === 0) return null;

  const topPlayer = players.find((p) => p.id === topStats.playerId);
  if (!topPlayer) return null;

  return {
    player: topPlayer,
    weekPoints: topStats.totalPoints,
    weekWins: topStats.wins,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
  };
}
