import Image from 'next/image';
import { format } from 'date-fns';
import type { WeekMVP as WeekMVPType } from '@/types';

interface WeekMVPProps {
  mvp: WeekMVPType;
}

export default function WeekMVP({ mvp }: WeekMVPProps) {
  const { player, weekPoints, weekWins, weekStart, weekEnd } = mvp;

  const avatarUrl = player.photoUrl
    ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=4a0060&textColor=00ff87`;

  const weekRange = `${format(new Date(weekStart), 'EEE d MMM')} – ${format(new Date(weekEnd), 'EEE d MMM')}`;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-pl-purple-mid to-pl-purple border border-pl-green/30 shadow-glow-green p-4">
      {/* Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center bg-pl-green text-pl-purple text-xs font-black px-3 py-1 rounded-full">
          ⚡ WEEK MVP
        </span>
      </div>

      {/* Content */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative w-[72px] h-[72px] rounded-full ring-2 ring-pl-green shadow-glow-green overflow-hidden">
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

          {/* Stats row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs text-white">
              {weekPoints} pts
            </span>
            <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs text-white">
              {weekWins} wins
            </span>
          </div>

          {/* Week range */}
          <p className="text-white/50 text-xs mt-1">{weekRange}</p>
        </div>
      </div>
    </div>
  );
}
