import { format, startOfWeek, endOfWeek } from 'date-fns';
import { getPlayers, getMatches } from '@/lib/firestore';
import MatchCard from '@/components/MatchCard';
import type { Match, Player } from '@/types';

export const dynamic = 'force-dynamic';

function getSundayStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 });
}

function groupMatchesByWeek(matches: Match[]): Map<string, Match[]> {
  const groups = new Map<string, Match[]>();

  for (const match of matches) {
    const matchDate = new Date(match.date);
    const sundayStart = getSundayStart(matchDate);
    const key = sundayStart.toISOString();

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(match);
  }

  return groups;
}

export default async function MatchesPage() {
  let matches: Match[] = [];
  let players: Player[] = [];
  let error: string | null = null;

  try {
    [matches, players] = await Promise.all([getMatches(), getPlayers()]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    players = [];
  }

  const grouped = groupMatchesByWeek(matches);
  // Sort week keys newest first
  const sortedWeekKeys = Array.from(grouped.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-b from-pl-purple-dark to-pl-purple px-4 pt-8 pb-6 text-center">
        <div className="text-3xl mb-2">📅</div>
        <h1 className="text-3xl font-black tracking-wider text-pl-green uppercase">
          MATCH HISTORY
        </h1>
        <p className="text-white/60 text-sm font-medium tracking-widest uppercase mt-1">
          2025/26 Season
        </p>
      </div>

      <div className="px-3 pt-2">
        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-500/30 p-4 mb-4 text-center">
            <p className="text-red-400 text-sm">Failed to load matches: {error}</p>
          </div>
        )}

        {!error && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">📆</span>
            <p className="text-white font-semibold text-lg mb-2">No matches yet</p>
            <p className="text-white/50 text-sm max-w-xs">
              First match results will appear here once uploaded by the admin.
            </p>
          </div>
        )}

        {sortedWeekKeys.map((weekKey) => {
          const weekMatches = grouped.get(weekKey)!;
          const weekStart = new Date(weekKey);
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
          const weekLabel = `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`;

          return (
            <div key={weekKey}>
              <p className="text-pl-green/80 text-sm font-semibold uppercase tracking-wider px-4 py-2 mt-4">
                Week of {weekLabel}
              </p>
              {weekMatches.map((match) => (
                <MatchCard key={match.id} match={match} players={players} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
