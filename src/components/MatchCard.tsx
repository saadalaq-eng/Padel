import { format, isToday, isYesterday } from 'date-fns';
import type { Match, Player } from '@/types';

interface MatchCardProps {
  match: Match;
  players: Player[];
}

function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return `Today · ${format(d, 'h:mm aa')}`;
  if (isYesterday(d)) return `Yesterday · ${format(d, 'h:mm aa')}`;
  return format(d, 'EEE d MMM · h:mm aa');
}

function PlayerAvatar({ player }: { player: Player | undefined }) {
  if (!player) return null;
  return player.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={player.photoUrl}
      alt={player.name}
      className="w-7 h-7 rounded-full object-cover border border-white/20 flex-shrink-0"
    />
  ) : (
    <div className="w-7 h-7 rounded-full bg-pl-purple-mid border border-white/20 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-bold text-white/60">
        {player.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

export default function MatchCard({ match, players }: MatchCardProps) {
  const getPlayer = (id: string): Player | undefined => players.find((p) => p.id === id);

  const team1Players = match.team1.map(getPlayer);
  const team2Players = match.team2.map(getPlayer);

  const isTeam1Winner = match.winnerTeam === 1;
  const isTeam2Winner = match.winnerTeam === 2;
  const isDraw = match.winnerTeam === 0;

  const team1Result = isTeam1Winner ? 'win' : isDraw ? 'draw' : 'loss';
  const team2Result = isTeam2Winner ? 'win' : isDraw ? 'draw' : 'loss';

  const rowClass = (result: 'win' | 'draw' | 'loss') =>
    result === 'win'
      ? 'text-white'
      : result === 'draw'
      ? 'text-amber-300/80'
      : 'text-white/45';

  const scoreClass = (teamScore: number, oppScore: number, result: 'win' | 'draw' | 'loss') => {
    const setWon = teamScore > oppScore;
    if (result === 'win' && setWon) return 'text-white font-black';
    if (result === 'win' && !setWon) return 'text-white/35 font-bold';
    if (result === 'draw') return 'text-amber-300/70 font-bold';
    if (result === 'loss' && setWon) return 'text-white/60 font-bold';
    return 'text-white/30 font-bold';
  };

  const resultIcon = (result: 'win' | 'draw' | 'loss') => {
    if (result === 'win') return <span className="text-base leading-none">🏆</span>;
    if (result === 'draw') return <span className="text-xs font-black text-amber-300 leading-none">D</span>;
    return <span className="w-4" />;
  };

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden mb-2">
      {/* Date header */}
      <div className="px-3 pt-2 pb-1 text-right">
        <span className="text-white/35 text-[11px] tracking-wide">{formatMatchDate(match.date)}</span>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-white/5" />

      {/* Team 1 row */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        {/* Avatars */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {team1Players.map((p, i) => <PlayerAvatar key={match.team1[i]} player={p} />)}
        </div>
        {/* Names */}
        <div className={`flex-1 min-w-0 text-sm font-semibold truncate ${rowClass(team1Result)}`}>
          {team1Players.map((p) => p?.name ?? '?').join(' & ')}
        </div>
        {/* Trophy / Draw / empty */}
        <div className="w-5 flex items-center justify-center flex-shrink-0">
          {resultIcon(team1Result)}
        </div>
        {/* Set scores */}
        {match.sets.map((set, i) => (
          <span
            key={i}
            className={`w-6 text-center text-sm flex-shrink-0 ${scoreClass(set.team1, set.team2, team1Result)}`}
          >
            {set.team1}
          </span>
        ))}
      </div>

      {/* Team 2 row */}
      <div className="flex items-center gap-2 px-3 pt-1.5 pb-2.5">
        {/* Avatars */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {team2Players.map((p, i) => <PlayerAvatar key={match.team2[i]} player={p} />)}
        </div>
        {/* Names */}
        <div className={`flex-1 min-w-0 text-sm font-semibold truncate ${rowClass(team2Result)}`}>
          {team2Players.map((p) => p?.name ?? '?').join(' & ')}
        </div>
        {/* Trophy / Draw / empty */}
        <div className="w-5 flex items-center justify-center flex-shrink-0">
          {resultIcon(team2Result)}
        </div>
        {/* Set scores */}
        {match.sets.map((set, i) => (
          <span
            key={i}
            className={`w-6 text-center text-sm flex-shrink-0 ${scoreClass(set.team2, set.team1, team2Result)}`}
          >
            {set.team2}
          </span>
        ))}
      </div>
    </div>
  );
}
