import type { RankingEntry, WeekMVP as WeekMVPType } from '@/types';
import PlayerRow from './PlayerRow';
import WeekMVP from './WeekMVP';

interface RankingTableProps {
  rankings: RankingEntry[];
  mvp: WeekMVPType | null;
}

export default function RankingTable({ rankings, mvp }: RankingTableProps) {
  return (
    <div className="max-w-lg mx-auto px-0">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Column headers */}
          <thead>
            <tr className="bg-pl-purple-mid sticky top-0 z-10">
              <th className="px-2 sm:px-3 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center w-10">
                #
              </th>
              <th className="px-2 sm:px-3 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-left">
                Player
              </th>
              <th className="px-2 sm:px-3 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">
                PL
              </th>
              <th className="px-2 sm:px-3 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">
                W
              </th>
              <th className="px-2 sm:px-3 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">
                L
              </th>
              <th className="px-2 sm:px-3 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center hidden sm:table-cell">
                GW
              </th>
              <th className="px-2 sm:px-3 py-2 text-white/60 uppercase tracking-widest text-xs font-semibold text-center">
                PTS
              </th>
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

      {/* Week MVP */}
      {mvp && (
        <div className="mt-4 px-3 pb-4">
          <WeekMVP mvp={mvp} />
        </div>
      )}
    </div>
  );
}
