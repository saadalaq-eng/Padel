import type { HotStreak, RankingEntry } from '@/types';
import PlayerRow from './PlayerRow';
import HotStreakMVP from './HotStreakMVP';

interface RankingTableProps {
  rankings: RankingEntry[];
  hotStreak: HotStreak | null;
}

export default function RankingTable({ rankings, hotStreak }: RankingTableProps) {
  return (
    <div className="max-w-lg mx-auto px-0">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-pl-purple-mid sticky top-0 z-10">
              <th className="px-2 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center w-10">#</th>
              <th className="px-2 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-left">Player</th>
              <th className="px-1 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">PL</th>
              <th className="px-1 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">W</th>
              <th className="px-1 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">D</th>
              <th className="px-1 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">L</th>
              <th className="px-1 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">GW</th>
              <th className="px-2 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">PTS</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((entry, index) => (
              <PlayerRow key={entry.player.id} entry={entry} index={index} />
            ))}
          </tbody>
        </table>

        {rankings.length === 0 && (
          <p className="text-white/40 text-sm text-center py-10">
            No rankings yet. Play some matches!
          </p>
        )}
      </div>

      {/* Hot Streak MVP */}
      {hotStreak && (
        <div className="mt-4 mx-3">
          <HotStreakMVP hotStreak={hotStreak} />
        </div>
      )}

      {/* Points system reference */}
      <div className="mx-3 mt-4 pb-4 rounded-xl bg-white/5 border border-white/10 p-4">
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-3">Points System</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-pl-green/10 border border-pl-green/20 py-2 px-1">
            <p className="text-pl-green font-black text-base">3</p>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide mt-0.5">Win</p>
            <p className="text-white/35 text-[9px] mt-0.5">+1 per game won</p>
          </div>
          <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 py-2 px-1">
            <p className="text-amber-300 font-black text-base">1</p>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide mt-0.5">Draw</p>
            <p className="text-white/35 text-[9px] mt-0.5">+1 per game won</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 py-2 px-1">
            <p className="text-white/50 font-black text-base">0</p>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide mt-0.5">Lose</p>
            <p className="text-white/35 text-[9px] mt-0.5">+1 per game won</p>
          </div>
        </div>
      </div>
    </div>
  );
}
