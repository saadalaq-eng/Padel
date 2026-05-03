import { format } from 'date-fns';
import { getPlayers, getMatches, getMatchesBefore, getMatchesBetween } from '@/lib/firestore';
import { computeRankings, computeWeekMVP, getCurrentWeekBounds } from '@/lib/scoring';
import RankingTable from '@/components/RankingTable';
import type { RankingEntry, WeekMVP } from '@/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let rankings: RankingEntry[];
  let mvp: WeekMVP | null;
  let error: string | null = null;
  let noPlayers = false;

  try {
    const players = await getPlayers();

    if (players.length === 0) {
      noPlayers = true;
      rankings = [] as RankingEntry[];
      mvp = null;
    } else {
      const allMatches = await getMatches();
      const { start: weekStart, end: weekEnd } = getCurrentWeekBounds();
      const preWeekMatches = await getMatchesBefore(weekStart);
      const weekMatches = await getMatchesBetween(weekStart, weekEnd);
      rankings = computeRankings(players, allMatches, preWeekMatches);
      mvp = computeWeekMVP(players, weekMatches, weekStart, weekEnd);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    rankings = [] as RankingEntry[];
    mvp = null;
  }

  const today = new Date();
  const formattedDate = format(today, 'EEEE, d MMMM yyyy');

  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="rounded-2xl bg-red-900/20 border border-red-500/30 p-6">
          <p className="text-red-400 font-semibold text-lg mb-2">Firebase Not Configured</p>
          <p className="text-white/60 text-sm mb-4">
            Set up your Firebase environment variables in <code className="text-pl-green">.env.local</code>.
          </p>
          <pre className="text-left text-xs text-white/40 bg-black/30 rounded-lg p-3 overflow-x-auto">
            {`FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."`}
          </pre>
          <p className="text-white/40 text-xs mt-3">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (noPlayers) {
    return (
      <div className="px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-b from-pl-purple-dark to-pl-purple px-4 pt-8 pb-6 text-center -mx-4">
          <div className="text-4xl mb-2">🎾</div>
          <h1 className="text-3xl font-black tracking-wider text-pl-green uppercase">
            MANHOOD LEAGUE
          </h1>
          <p className="text-white/60 text-sm font-medium tracking-widest uppercase mt-1">
            2025/26 Season
          </p>
          <p className="text-white/40 text-xs mt-2">{formattedDate}</p>
        </div>

        {/* First-time setup */}
        <div className="mt-6 rounded-2xl bg-pl-purple-mid/40 border border-pl-green/20 p-6 text-center">
          <p className="text-pl-green font-bold text-lg mb-1">First-time Setup</p>
          <p className="text-white/60 text-sm mb-4">
            No players found. Seed the league with these 6 players:
          </p>
          <ul className="text-white/80 text-sm space-y-1 mb-6">
            {['Yazeed M', 'Fahad M', 'Abdullah', 'Saad', 'Yazeed', 'Abdulmohsen'].map((name) => (
              <li key={name} className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pl-green inline-block" />
                {name}
              </li>
            ))}
          </ul>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 bg-pl-green text-pl-purple font-bold px-6 py-3 rounded-xl text-sm hover:bg-pl-green/90 transition-colors"
          >
            Go to Admin to Seed Players
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-b from-pl-purple-dark to-pl-purple px-4 pt-8 pb-6 text-center">
        <div className="text-3xl mb-2">🎾</div>
        <h1 className="text-3xl font-black tracking-wider text-pl-green uppercase">
          MANHOOD LEAGUE
        </h1>
        <p className="text-white/60 text-sm font-medium tracking-widest uppercase mt-1">
          2025/26 Season
        </p>
        <p className="text-white/40 text-xs mt-2">{formattedDate}</p>
      </div>

      {/* Rankings */}
      <RankingTable rankings={rankings} mvp={mvp} />
    </div>
  );
}
