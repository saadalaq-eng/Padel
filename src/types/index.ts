export type RankChange = 'up' | 'down' | 'same';

export interface Player {
  id: string;
  name: string;
  photoUrl?: string;
  createdAt: string;
}

export interface SetScore {
  team1: number; // games won by team1 in this set
  team2: number; // games won by team2 in this set
}

export interface Match {
  id: string;
  date: string; // ISO date string
  team1: [string, string]; // two player IDs
  team2: [string, string]; // two player IDs
  sets: SetScore[];
  winnerTeam: 1 | 2 | 0; // 0 = draw
  createdAt: string;
}

export interface PlayerStats {
  playerId: string;
  totalPoints: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
}

export interface RankingEntry {
  player: Player;
  stats: PlayerStats;
  rank: number;
  previousRank: number | null;
  rankChange: RankChange;
}

export interface WeekMVP {
  player: Player;
  weekPoints: number;
  weekWins: number;
  weekStart: string;
  weekEnd: string;
}

export interface ExtractedMatchData {
  team1PlayerNames: string[];
  team2PlayerNames: string[];
  sets: SetScore[];
  winnerTeam: 1 | 2 | 0; // 0 = draw
  matchDate: string;
  confidence: number;
  rawText?: string;
}

export interface ConfirmMatchPayload {
  team1: [string, string];
  team2: [string, string];
  sets: SetScore[];
  winnerTeam: 1 | 2 | 0;
  date: string;
  adminPassword: string;
}
