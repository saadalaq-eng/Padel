'use client';

import { useState, useEffect } from 'react';
import type {
  ExtractedMatchData,
  Match,
  Player,
  ConfirmMatchPayload,
  SetScore,
} from '@/types';
import MatchCard from '@/components/MatchCard';

interface ConfirmMatchModalProps {
  extracted: ExtractedMatchData;
  players: Player[];
  onConfirm: (payload: ConfirmMatchPayload) => void;
  onCancel: () => void;
  adminPassword: string;
}

function findPlayerIdByName(name: string, players: Player[]): string {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  // Exact match first
  const exact = players.find((p) => p.name.toLowerCase() === lower);
  if (exact) return exact.id;
  // Partial match
  const partial = players.find(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      lower.includes(p.name.toLowerCase())
  );
  return partial?.id ?? '';
}

function confidenceBadge(confidence: number) {
  if (confidence > 0.85) {
    return (
      <span className="inline-flex items-center gap-1 bg-pl-green/20 text-pl-green text-xs font-bold px-3 py-1 rounded-full border border-pl-green/40">
        ✓ High confidence
      </span>
    );
  }
  if (confidence >= 0.6) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40">
        ⚠ Check carefully
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/40">
      ✗ Low confidence – please verify
    </span>
  );
}

export default function ConfirmMatchModal({
  extracted,
  players,
  onConfirm,
  onCancel,
  adminPassword,
}: ConfirmMatchModalProps) {
  const [team1, setTeam1] = useState<[string, string]>(['', '']);
  const [team2, setTeam2] = useState<[string, string]>(['', '']);
  const [sets, setSets] = useState<SetScore[]>(extracted.sets.length > 0 ? extracted.sets : [{ team1: 0, team2: 0 }]);
  const [matchDate, setMatchDate] = useState(extracted.matchDate ?? '');
  const [winnerTeam, setWinnerTeam] = useState<0 | 1 | 2>(extracted.winnerTeam);
  const [errors, setErrors] = useState<string[]>([]);

  // Pre-fill from extracted data on mount
  useEffect(() => {
    const t1p0 = findPlayerIdByName(extracted.team1PlayerNames[0] ?? '', players);
    const t1p1 = findPlayerIdByName(extracted.team1PlayerNames[1] ?? '', players);
    const t2p0 = findPlayerIdByName(extracted.team2PlayerNames[0] ?? '', players);
    const t2p1 = findPlayerIdByName(extracted.team2PlayerNames[1] ?? '', players);
    setTeam1([t1p0, t1p1]);
    setTeam2([t2p0, t2p1]);
  }, [extracted, players]);

  const updateTeam1Player = (index: 0 | 1, value: string) => {
    setTeam1((prev) => {
      const next: [string, string] = [...prev] as [string, string];
      next[index] = value;
      return next;
    });
  };

  const updateTeam2Player = (index: 0 | 1, value: string) => {
    setTeam2((prev) => {
      const next: [string, string] = [...prev] as [string, string];
      next[index] = value;
      return next;
    });
  };

  const updateSet = (i: number, side: 'team1' | 'team2', value: string) => {
    const num = parseInt(value, 10);
    setSets((prev) =>
      prev.map((s, idx) =>
        idx === i ? { ...s, [side]: isNaN(num) ? 0 : Math.max(0, num) } : s
      )
    );
  };

  const addSet = () => setSets((prev) => [...prev, { team1: 0, team2: 0 }]);

  const removeSet = (i: number) => {
    if (sets.length <= 1) return;
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    const allPlayers = [team1[0], team1[1], team2[0], team2[1]];

    if (allPlayers.some((p) => !p)) {
      errs.push('All 4 players must be selected.');
    } else {
      const unique = new Set(allPlayers);
      if (unique.size < 4) {
        errs.push('All 4 players must be different.');
      }
    }

    if (sets.length < 1) {
      errs.push('At least 1 set is required.');
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    const payload: ConfirmMatchPayload = {
      team1,
      team2,
      sets,
      winnerTeam,
      date: matchDate,
      adminPassword,
    };
    onConfirm(payload);
  };

  // Detect winner from sets totals (0 = draw)
  const autoDetectWinner = (): 0 | 1 | 2 => {
    let t1Wins = 0;
    let t2Wins = 0;
    for (const s of sets) {
      if (s.team1 > s.team2) t1Wins++;
      else if (s.team2 > s.team1) t2Wins++;
    }
    if (t1Wins === t2Wins) return 0;
    return t1Wins > t2Wins ? 1 : 2;
  };

  const playerOptions = (
    <>
      <option value="">Select player…</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </>
  );

  const selectClass =
    'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pl-green/60 focus:bg-white/15 transition-colors';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-pl-purple-dark rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Title row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-pl-green">Verify Match Data</h2>
            <div className="mt-1">{confidenceBadge(extracted.confidence)}</div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/50 hover:text-white transition-colors text-lg leading-none ml-4"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Live preview card */}
        {(team1[0] || team1[1] || team2[0] || team2[1]) && (() => {
          const previewMatch: Match = {
            id: 'preview',
            date: matchDate || new Date().toISOString(),
            team1: [team1[0] || team1[1] || '', team1[1] || team1[0] || ''] as [string, string],
            team2: [team2[0] || team2[1] || '', team2[1] || team2[0] || ''] as [string, string],
            sets,
            winnerTeam,
            createdAt: new Date().toISOString(),
          };
          return (
            <div className="mb-5">
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">Preview</p>
              <MatchCard match={previewMatch} players={players} />
            </div>
          );
        })()}

        {/* Team 1 */}
        <div className="mb-4">
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
            Team 1
          </p>
          <div className="flex flex-col gap-2">
            <select
              className={selectClass}
              value={team1[0]}
              onChange={(e) => updateTeam1Player(0, e.target.value)}
            >
              {playerOptions}
            </select>
            <select
              className={selectClass}
              value={team1[1]}
              onChange={(e) => updateTeam1Player(1, e.target.value)}
            >
              {playerOptions}
            </select>
          </div>
        </div>

        {/* Team 2 */}
        <div className="mb-4">
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
            Team 2
          </p>
          <div className="flex flex-col gap-2">
            <select
              className={selectClass}
              value={team2[0]}
              onChange={(e) => updateTeam2Player(0, e.target.value)}
            >
              {playerOptions}
            </select>
            <select
              className={selectClass}
              value={team2[1]}
              onChange={(e) => updateTeam2Player(1, e.target.value)}
            >
              {playerOptions}
            </select>
          </div>
        </div>

        {/* Sets */}
        <div className="mb-4">
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
            Sets
          </p>
          <div className="flex flex-col gap-2">
            {sets.map((set, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-white/40 text-xs w-10 text-right">Set {i + 1}</span>
                <input
                  type="number"
                  min={0}
                  value={set.team1}
                  onChange={(e) => updateSet(i, 'team1', e.target.value)}
                  className="w-14 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-pl-green/60 transition-colors"
                />
                <span className="text-white/40 font-bold">–</span>
                <input
                  type="number"
                  min={0}
                  value={set.team2}
                  onChange={(e) => updateSet(i, 'team2', e.target.value)}
                  className="w-14 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-pl-green/60 transition-colors"
                />
                {sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSet(i)}
                    className="text-red-400/70 hover:text-red-400 text-xs transition-colors ml-1"
                    aria-label={`Remove set ${i + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSet}
            className="mt-2 text-pl-green/70 hover:text-pl-green text-xs font-medium transition-colors"
          >
            + Add set
          </button>
        </div>

        {/* Match date */}
        <div className="mb-4">
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
            Match Date
          </p>
          <input
            type="datetime-local"
            value={matchDate ? matchDate.slice(0, 16) : ''}
            onChange={(e) => setMatchDate(e.target.value ? `${e.target.value}:00` : '')}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pl-green/60 transition-colors"
          />
        </div>

        {/* Winner */}
        <div className="mb-5">
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
            Winner
          </p>
          <div className="flex gap-2">
            <label
              className={`flex-1 flex items-center justify-center gap-2 border rounded-lg px-2 py-2 cursor-pointer transition-colors text-sm ${
                winnerTeam === 1
                  ? 'border-pl-green bg-pl-green/10 text-pl-green'
                  : 'border-white/20 text-white/60 hover:border-white/40'
              }`}
            >
              <input
                type="radio"
                name="winner"
                value="1"
                checked={winnerTeam === 1}
                onChange={() => setWinnerTeam(1)}
                className="sr-only"
              />
              Team 1
            </label>
            <label
              className={`flex-1 flex items-center justify-center gap-2 border rounded-lg px-2 py-2 cursor-pointer transition-colors text-sm ${
                winnerTeam === 0
                  ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                  : 'border-white/20 text-white/60 hover:border-white/40'
              }`}
            >
              <input
                type="radio"
                name="winner"
                value="0"
                checked={winnerTeam === 0}
                onChange={() => setWinnerTeam(0)}
                className="sr-only"
              />
              Draw
            </label>
            <label
              className={`flex-1 flex items-center justify-center gap-2 border rounded-lg px-2 py-2 cursor-pointer transition-colors text-sm ${
                winnerTeam === 2
                  ? 'border-pl-green bg-pl-green/10 text-pl-green'
                  : 'border-white/20 text-white/60 hover:border-white/40'
              }`}
            >
              <input
                type="radio"
                name="winner"
                value="2"
                checked={winnerTeam === 2}
                onChange={() => setWinnerTeam(2)}
                className="sr-only"
              />
              Team 2
            </label>
          </div>
          <button
            type="button"
            onClick={() => setWinnerTeam(autoDetectWinner())}
            className="mt-1 text-white/40 hover:text-white/60 text-xs transition-colors"
          >
            Auto-detect from sets
          </button>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {errors.map((e, i) => (
              <p key={i} className="text-red-400 text-xs">
                {e}
              </p>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-xl py-3 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-pl-green text-pl-purple font-bold rounded-xl py-3 text-sm hover:bg-pl-green/90 active:scale-95 transition-all"
          >
            Confirm &amp; Save
          </button>
        </div>
      </div>
    </div>
  );
}
