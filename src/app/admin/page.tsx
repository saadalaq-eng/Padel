'use client';

import { useState, useEffect, useRef } from 'react';
import type { Player, ExtractedMatchData, ConfirmMatchPayload } from '@/types';
import UploadZone from '@/components/UploadZone';
import ConfirmMatchModal from '@/components/ConfirmMatchModal';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

type Step = 'auth' | 'setup' | 'upload' | 'analyzing' | 'confirm' | 'success';

const STEP_NUMBERS: Record<Step, number> = {
  auth: 1,
  setup: 2,
  upload: 3,
  analyzing: 3,
  confirm: 3,
  success: 4,
};
const TOTAL_STEPS = 4;

export default function AdminPage() {
  const [step, setStep] = useState<Step>('auth');
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Setup step
  const [players, setPlayers] = useState<Player[]>([]);
  const [team1p1, setTeam1p1] = useState('');
  const [team1p2, setTeam1p2] = useState('');
  const [team2p1, setTeam2p1] = useState('');
  const [team2p2, setTeam2p2] = useState('');
  const [setupError, setSetupError] = useState('');

  // Upload step
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);

  // Analyzing / confirm
  const [extractedData, setExtractedData] = useState<ExtractedMatchData | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');

  // Success
  const [savedTeam1Names, setSavedTeam1Names] = useState<[string, string]>(['', '']);
  const [savedTeam2Names, setSavedTeam2Names] = useState<[string, string]>(['', '']);

  // Manage Players section
  const [photoUploadingId, setPhotoUploadingId] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [playerPhotos, setPlayerPhotos] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Danger Zone / Reset Season
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Fetch players when entering setup step or when authenticated
  useEffect(() => {
    if (step === 'setup' && players.length === 0) {
      fetch('/api/players')
        .then((res) => res.json())
        .then((data: Player[]) => {
          setPlayers(data);
          // Initialise playerPhotos from existing photoUrl values
          const photos: Record<string, string> = {};
          data.forEach((p) => {
            if (p.photoUrl) photos[p.id] = p.photoUrl;
          });
          setPlayerPhotos((prev) => ({ ...photos, ...prev }));
        })
        .catch(() => {/* silently ignore */});
    }
  }, [step, players.length]);

  // Auth step
  const handleAuth = () => {
    if (!passwordInput.trim()) return;
    setAdminPassword(passwordInput.trim());
    setPasswordInput('');
    setStep('setup');
  };

  // Setup step
  const handleSetupNext = () => {
    const selected = [team1p1, team1p2, team2p1, team2p2];
    if (selected.some((v) => !v)) {
      setSetupError('Please select all 4 players.');
      return;
    }
    const unique = new Set(selected);
    if (unique.size < 4) {
      setSetupError('All 4 players must be different.');
      return;
    }
    setSetupError('');
    setStep('upload');
  };

  // Upload step
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(undefined);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzeError('');
    setStep('analyzing');

    try {
      const playerNames = [team1p1, team1p2, team2p1, team2p2]
        .map((id) => players.find((p) => p.id === id)?.name ?? id);

      const formData = new FormData();
      formData.append('screenshot', selectedFile);
      formData.append('players', JSON.stringify(playerNames));
      formData.append('adminPassword', adminPassword);

      const res = await fetch('/api/upload-match', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setExtractedData(data as ExtractedMatchData);
      setStep('confirm');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Failed to analyze screenshot');
      setStep('upload');
    }
  };

  const handleConfirm = async (payload: ConfirmMatchPayload) => {
    const res = await fetch('/api/confirm-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Server error ${res.status}`);
    }

    // Save names for success screen
    const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name ?? id;
    setSavedTeam1Names([getPlayerName(payload.team1[0]), getPlayerName(payload.team1[1])]);
    setSavedTeam2Names([getPlayerName(payload.team2[0]), getPlayerName(payload.team2[1])]);
    setStep('success');
  };

  const handleUploadAnother = () => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(undefined);
    }
    setExtractedData(null);
    setAnalyzeError('');
    setStep('setup');
  };

  // Manage Players — photo upload
  const handlePhotoChange = async (playerId: string, file: File) => {
    setPhotoUploadingId(playerId);
    setPhotoError(null);

    try {
      const formData = new FormData();
      formData.append('adminPassword', adminPassword);
      formData.append('playerId', playerId);
      formData.append('photo', file);

      const res = await fetch('/api/upload-player-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setPlayerPhotos((prev) => ({ ...prev, [playerId]: data.photoUrl as string }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setPhotoUploadingId(null);
    }
  };

  // Danger Zone — reset season
  const handleResetSeason = async () => {
    const confirmed = window.confirm('Delete ALL match history? This cannot be undone.');
    if (!confirmed) return;

    setResetting(true);
    setResetSuccess(false);
    setResetError(null);

    try {
      const res = await fetch('/api/reset-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setResetSuccess(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const currentStepNum = STEP_NUMBERS[step];

  const playerSelectClass =
    'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pl-green/60 focus:bg-white/15 transition-colors appearance-none';

  const getPlayerOptions = () => (
    <>
      <option value="">Select player…</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </>
  );

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-pl-purple-dark to-pl-purple -mx-4 px-4 pt-8 pb-6 text-center mb-6">
        <ShieldCheckIcon className="w-8 h-8 text-pl-green mx-auto mb-2" />
        <h1 className="text-2xl font-black tracking-wider text-pl-green uppercase">
          Admin Portal
        </h1>
        <p className="text-white/50 text-xs tracking-widest uppercase mt-1">
          Match Management
        </p>
      </div>

      {/* Step indicator (not shown on auth) */}
      {step !== 'auth' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const num = i + 1;
            const isActive = num === currentStepNum;
            const isDone = num < currentStepNum;
            return (
              <div key={num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone
                      ? 'bg-pl-green text-pl-purple'
                      : isActive
                      ? 'bg-pl-green/20 border-2 border-pl-green text-pl-green'
                      : 'bg-white/10 text-white/30'
                  }`}
                >
                  {isDone ? '✓' : num}
                </div>
                {num < TOTAL_STEPS && (
                  <div
                    className={`w-8 h-0.5 ${
                      isDone ? 'bg-pl-green/60' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Auth Step ── */}
      {step === 'auth' && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-bold text-pl-green mb-1">Admin Access</h2>
          <p className="text-white/50 text-sm mb-5">Enter your admin password to continue.</p>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Admin password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-pl-green/60 transition-colors"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAuth}
              disabled={!passwordInput.trim()}
              className="w-full bg-pl-green text-pl-purple font-bold rounded-xl py-3 text-sm hover:bg-pl-green/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enter
            </button>
          </div>
        </div>
      )}

      {/* ── Setup Step ── */}
      {step === 'setup' && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-bold text-pl-green mb-1">Select Players</h2>
          <p className="text-white/50 text-sm mb-5">Choose the 4 players for this match.</p>

          {players.length === 0 && (
            <p className="text-white/40 text-sm text-center py-4">Loading players…</p>
          )}

          {players.length > 0 && (
            <div className="flex flex-col gap-4">
              {/* Team 1 */}
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
                  Team 1
                </p>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <select
                      className={playerSelectClass}
                      value={team1p1}
                      onChange={(e) => setTeam1p1(e.target.value)}
                    >
                      {getPlayerOptions()}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      className={playerSelectClass}
                      value={team1p2}
                      onChange={(e) => setTeam1p2(e.target.value)}
                    >
                      {getPlayerOptions()}
                    </select>
                  </div>
                </div>
              </div>

              {/* Team 2 */}
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
                  Team 2
                </p>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <select
                      className={playerSelectClass}
                      value={team2p1}
                      onChange={(e) => setTeam2p1(e.target.value)}
                    >
                      {getPlayerOptions()}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      className={playerSelectClass}
                      value={team2p2}
                      onChange={(e) => setTeam2p2(e.target.value)}
                    >
                      {getPlayerOptions()}
                    </select>
                  </div>
                </div>
              </div>

              {setupError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {setupError}
                </p>
              )}

              <button
                type="button"
                onClick={handleSetupNext}
                className="w-full bg-pl-green text-pl-purple font-bold rounded-xl py-3 text-sm hover:bg-pl-green/90 active:scale-95 transition-all mt-2"
              >
                Next: Upload Screenshot →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Upload Step ── */}
      {step === 'upload' && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-bold text-pl-green mb-1">Upload Match Screenshot</h2>
          <p className="text-white/50 text-sm mb-5">
            Upload a Playtomic screenshot to extract match data with AI.
          </p>

          <UploadZone
            onFileSelect={handleFileSelect}
            preview={preview}
            onClear={handleClearFile}
          />

          {selectedFile && (
            <p className="text-white/50 text-xs text-center mt-2 truncate">
              {selectedFile.name}
            </p>
          )}

          {analyzeError && (
            <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-red-400 text-xs">{analyzeError}</p>
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={() => setStep('setup')}
              className="flex-1 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-xl py-3 text-sm font-medium transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!selectedFile}
              className="flex-1 bg-pl-green text-pl-purple font-bold rounded-xl py-3 text-sm hover:bg-pl-green/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Analyze with AI →
            </button>
          </div>
        </div>
      )}

      {/* ── Analyzing Step ── */}
      {step === 'analyzing' && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-10 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-pl-green/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-pl-green animate-spin" />
          </div>
          <p className="text-white font-semibold text-lg mb-1">Analyzing screenshot…</p>
          <p className="text-white/40 text-sm">Claude AI is reading the match data</p>
        </div>
      )}

      {/* ── Confirm Step ── */}
      {step === 'confirm' && extractedData && (
        <ConfirmMatchModal
          extracted={extractedData}
          players={players}
          onConfirm={handleConfirm}
          onCancel={() => setStep('upload')}
          adminPassword={adminPassword}
        />
      )}

      {/* ── Success Step ── */}
      {step === 'success' && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-pl-green/20 border-2 border-pl-green flex items-center justify-center mb-4 glow-green">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-pl-green mb-2">Match Saved!</h2>
          <p className="text-white/80 text-sm mb-5">The match result has been recorded successfully.</p>

          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6 w-full">
            <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
              Match Summary
            </p>
            <p className="text-white text-sm font-medium">
              {savedTeam1Names[0]} &amp; {savedTeam1Names[1]}
            </p>
            <p className="text-white/40 text-xs my-1 font-semibold">vs</p>
            <p className="text-white text-sm font-medium">
              {savedTeam2Names[0]} &amp; {savedTeam2Names[1]}
            </p>
          </div>

          <button
            type="button"
            onClick={handleUploadAnother}
            className="w-full bg-pl-green text-pl-purple font-bold rounded-xl py-3 text-sm hover:bg-pl-green/90 active:scale-95 transition-all"
          >
            Upload Another Match
          </button>
        </div>
      )}

      {/* ── Manage Players (visible when authenticated) ── */}
      {step !== 'auth' && (
        <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-bold text-pl-green mb-1">Manage Players</h2>
          <p className="text-white/50 text-sm mb-5">Update player profile photos.</p>

          {players.length === 0 && (
            <p className="text-white/40 text-sm text-center py-4">Loading players…</p>
          )}

          {photoError && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-red-400 text-xs">{photoError}</p>
            </div>
          )}

          {players.length > 0 && (
            <div className="flex flex-col gap-3">
              {players.map((player) => {
                const currentPhoto = playerPhotos[player.id] ?? player.photoUrl;
                const isUploading = photoUploadingId === player.id;
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-pl-purple-mid border border-white/20 flex-shrink-0 flex items-center justify-center">
                      {currentPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={currentPhoto}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white/40 text-lg font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <p className="flex-1 text-white text-sm font-medium truncate">{player.name}</p>

                    {/* Hidden file input */}
                    <input
                      ref={(el) => { fileInputRefs.current[player.id] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          void handlePhotoChange(player.id, file);
                        }
                        // Reset so same file can be re-selected
                        e.target.value = '';
                      }}
                    />

                    {/* Change Photo button */}
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[player.id]?.click()}
                      className="flex-shrink-0 text-xs font-semibold border border-pl-green/40 text-pl-green hover:bg-pl-green/10 active:scale-95 transition-all rounded-lg px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Uploading…' : 'Change Photo'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Danger Zone (visible when authenticated) ── */}
      {step !== 'auth' && (
        <div className="mt-6 mb-4 rounded-2xl bg-red-950/30 border border-red-500/30 p-6">
          <h2 className="text-xl font-bold text-red-400 mb-1">Danger Zone</h2>
          <p className="text-white/50 text-sm mb-5">
            Destructive actions that cannot be undone.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 bg-white/5 border border-red-500/20 rounded-xl px-4 py-3">
              <div>
                <p className="text-white text-sm font-semibold">Reset Season</p>
                <p className="text-white/40 text-xs mt-0.5">
                  Permanently delete all match records.
                </p>
              </div>
              <button
                type="button"
                disabled={resetting}
                onClick={() => void handleResetSeason()}
                className="flex-shrink-0 text-xs font-bold bg-red-600 hover:bg-red-500 active:scale-95 transition-all text-white rounded-lg px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resetting ? 'Resetting…' : 'Reset Season'}
              </button>
            </div>

            {resetSuccess && (
              <p className="text-pl-green text-sm bg-pl-green/10 border border-pl-green/30 rounded-lg px-3 py-2">
                Season reset. All match records deleted.
              </p>
            )}

            {resetError && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {resetError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
