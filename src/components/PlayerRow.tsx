import Image from 'next/image';
import type { RankingEntry } from '@/types';

interface PlayerRowProps {
  entry: RankingEntry;
  index: number;
}

const leftBorderClass = (index: number): string => {
  if (index === 0) return 'border-l-4 border-l-yellow-400';
  if (index === 1) return 'border-l-4 border-l-gray-400';
  if (index === 2) return 'border-l-4 border-l-amber-700';
  return 'border-l-4 border-l-transparent';
};

function RankChangeIndicator({ entry }: { entry: RankingEntry }) {
  const { rankChange, rank, previousRank } = entry;

  if (previousRank === null) {
    return (
      <span className="text-[10px] text-pl-green leading-none" title="New entry">
        ★
      </span>
    );
  }

  const diff = Math.abs(previousRank - rank);

  if (rankChange === 'up') {
    return (
      <span className="text-[10px] text-pl-green leading-none flex items-center gap-0.5">
        ▲<span>{diff}</span>
      </span>
    );
  }

  if (rankChange === 'down') {
    return (
      <span className="text-[10px] text-red-500 leading-none flex items-center gap-0.5">
        ▼<span>{diff}</span>
      </span>
    );
  }

  return (
    <span className="text-[10px] text-amber-400 leading-none">─</span>
  );
}

export default function PlayerRow({ entry, index }: PlayerRowProps) {
  const { player, stats, rank } = entry;

  const avatarUrl =
    player.photoUrl ??
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
      player.name
    )}&backgroundColor=4a0060&textColor=00ff87`;

  const rowBg =
    index % 2 === 1 ? 'bg-white/[0.03]' : 'bg-transparent';

  return (
    <tr
      className={`${rowBg} ${leftBorderClass(index)} hover:bg-white/[0.07] transition-colors min-h-[52px]`}
    >
      {/* Rank */}
      <td className="px-2 sm:px-3 py-2 text-center align-middle w-10">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-white font-bold text-sm leading-none">{rank}</span>
          <RankChangeIndicator entry={entry} />
        </div>
      </td>

      {/* Player */}
      <td className="px-2 sm:px-3 py-2 align-middle">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={avatarUrl}
              alt={player.name}
              fill
              className="object-cover rounded-full"
              unoptimized={!player.photoUrl}
            />
          </div>
          <span className="text-white text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">
            {player.name}
          </span>
        </div>
      </td>

      {/* Played */}
      <td className="px-2 sm:px-3 py-2 text-center align-middle text-white/80 text-sm">
        {stats.matchesPlayed}
      </td>

      {/* Wins */}
      <td className="px-1 py-2 text-center align-middle text-white/80 text-sm">
        {stats.wins}
      </td>

      {/* Draws */}
      <td className="px-1 py-2 text-center align-middle text-amber-300/70 text-sm">
        {stats.draws}
      </td>

      {/* Losses */}
      <td className="px-1 py-2 text-center align-middle text-white/80 text-sm">
        {stats.losses}
      </td>

      {/* Games Won */}
      <td className="px-1 py-2 text-center align-middle text-white/80 text-sm">
        {stats.gamesWon}
      </td>

      {/* Points */}
      <td className="px-2 sm:px-3 py-2 text-center align-middle text-pl-green font-bold text-base">
        {stats.totalPoints}
      </td>
    </tr>
  );
}
