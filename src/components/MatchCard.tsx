import { format } from 'date-fns';
import type { Match, Player } from '@/types';

interface MatchCardProps {
  match: Match;
  players: Player[];
}

export default function MatchCard({ match, players }: MatchCardProps) {
  const getPlayer = (id: string): Player | undefined =>
    players.find((p) => p.id === id);

  const team1Players = match.team1.map(getPlayer);
  const team2Players = match.team2.map(getPlayer);

  const isTeam1Winner = match.winnerTeam === 1;
  const isTeam2Winner = match.winnerTeam === 2;

  const formattedDate = format(new Date(match.date), "EEE d MMM yyyy · HH:mm");

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 mb-2">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        {/* Team 1 */}
        <div className="flex flex-col gap-0.5">
          {team1Players.map((player, i) => (
            <span
              key={match.team1[i]}
              className={`text-sm truncate ${
                isTeam1Winner ? 'text-white font-semibold' : 'text-white/50'
              }`}
            >
              {player?.name ?? 'Unknown'}
            </span>
          ))}
          {isTeam1Winner && (
            <span className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-pl-green text-pl-purple text-[9px] font-black">
              W
            </span>
          )}
        </div>

        {/* Scores */}
        <div className="flex flex-col items-center gap-1 px-2">
          {match.sets.map((set, i) => {
            const team1Bright = isTeam1Winner && set.team1 > set.team2;
            const team2Bright = isTeam2Winner && set.team2 > set.team1;
            return (
              <div
                key={i}
                className={`bg-white/10 rounded px-2 py-0.5 text-xs font-mono whitespace-nowrap ${
                  team1Bright || team2Bright ? 'text-white' : 'text-white/60'
                }`}
              >
                {set.team1} – {set.team2}
              </div>
            );
          })}
        </div>

        {/* Team 2 */}
        <div className="flex flex-col gap-0.5 items-end">
          {team2Players.map((player, i) => (
            <span
              key={match.team2[i]}
              className={`text-sm truncate ${
                isTeam2Winner ? 'text-white font-semibold' : 'text-white/50'
              }`}
            >
              {player?.name ?? 'Unknown'}
            </span>
          ))}
          {isTeam2Winner && (
            <span className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-pl-green text-pl-purple text-[9px] font-black self-end">
              W
            </span>
          )}
        </div>
      </div>

      {/* Date */}
      <p className="text-white/40 text-xs text-center mt-2">{formattedDate}</p>
    </div>
  );
}
