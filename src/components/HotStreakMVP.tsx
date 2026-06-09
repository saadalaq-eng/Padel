import Image from 'next/image';
import type { HotStreak } from '@/types';

interface HotStreakMVPProps {
  hotStreak: HotStreak;
}

export default function HotStreakMVP({ hotStreak }: HotStreakMVPProps) {
  const { entries, matchCount } = hotStreak;
  const isTied = entries.length > 1;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-pl-purple-mid to-pl-purple border border-pl-green/30 shadow-glow-green p-4">
      {/* Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center bg-pl-green text-pl-purple text-xs font-black px-3 py-1 rounded-full">
          🔥 HOT STREAK{isTied ? ' (TIED)' : ''}
        </span>
        <span className="ml-2 text-white/40 text-xs">Last {matchCount} matches</span>
      </div>

      {/* One or multiple players */}
      <div className={`flex flex-col gap-3`}>
        {entries.map(({ player, points, wins }) => {
          const avatarUrl =
            player.photoUrl ??
            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=4a0060&textColor=00ff87`;

          return (
            <div key={player.id} className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative w-[64px] h-[64px] rounded-full ring-2 ring-pl-green shadow-glow-green overflow-hidden">
                  <Image
                    src={avatarUrl}
                    alt={player.name}
                    fill
                    className="object-cover rounded-full"
                    unoptimized={!player.photoUrl}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-white truncate">{player.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="bg-pl-green/20 text-pl-green rounded-full px-2 py-0.5 text-xs font-bold border border-pl-green/30">
                    {points} pts
                  </span>
                  <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs text-white/70">
                    {wins}W in {matchCount} matches
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
