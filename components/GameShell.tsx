'use client';

import type { Challenge, GamePhase, GuessResult } from '@/lib/types';
import Timer from '@/components/Timer';
import SwipeCard from '@/components/SwipeCard';
import DecisionControls from '@/components/DecisionControls';
import ProgressIndicator from '@/components/ProgressIndicator';
import SocialTensionHint from '@/components/SocialTensionHint';
import ReasoningTags from '@/components/ReasoningTags';
import { copy } from '@/lib/copy';

interface GameShellProps {
  challenge: Challenge;
  nextImageUrl?: string;
  phase: GamePhase;
  timerKey: number;
  timerDuration: number;
  timerRunning: boolean;
  zenMode?: boolean;
  elapsedMs: number;
  currentIndex: number;
  total: number;
  results: GuessResult[];
  socialHint: string;
  showReasoningTags: boolean;
  onTimerExpire: () => void;
  onDecision: (choice: 'ai' | 'real') => void;
  onInvestigatingChange: (investigating: boolean) => void;
  onTagSelected: (tag: string) => void;
}

export default function GameShell({
  challenge,
  nextImageUrl,
  phase,
  timerKey,
  timerDuration,
  timerRunning,
  zenMode = false,
  elapsedMs,
  currentIndex,
  total,
  results,
  socialHint,
  showReasoningTags,
  onTimerExpire,
  onDecision,
  onInvestigatingChange,
  onTagSelected,
}: GameShellProps) {
  const disabled = phase !== 'playing' && phase !== 'investigating';
  const isCommitting = !timerRunning && (phase === 'playing' || phase === 'investigating') && !zenMode;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedLabel = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* ── Background: Full-Bleed Photograph ── */}
      <div className="absolute inset-0 z-10 h-full w-full">
        <SwipeCard
          challengeId={challenge.id}
          difficulty={challenge.difficulty}
          imageUrl={challenge.image_url}
          onSwipe={onDecision}
          disabled={disabled}
          onNextImageUrl={nextImageUrl}
          onInvestigatingChange={onInvestigatingChange}
        />
      </div>

      {/* ── Top Nav Cinematic Shadow Gradient Backdrop ── */}
      <div className="absolute top-0 inset-x-0 z-20 h-40 bg-gradient-to-b from-background/95 via-background/45 to-transparent pointer-events-none" />

      {/* ── Bottom Panel Cinematic Shadow Gradient Backdrop ── */}
      <div className="absolute bottom-0 inset-x-0 z-20 h-72 bg-gradient-to-t from-background via-background/75 to-transparent pointer-events-none" />

      {/* ── Floating: Top Navigation Overlay ── */}
      <div className="absolute top-0 inset-x-0 z-30 pointer-events-none flex flex-col pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="pointer-events-auto w-11">
            {!zenMode && (
              <Timer key={timerKey} duration={timerDuration} running={timerRunning} onExpire={onTimerExpire} />
            )}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="font-mono text-label font-light uppercase tracking-kicker text-muted/65">
              UNCANNY
            </div>
            <div className="font-mono text-label font-light uppercase tracking-label text-muted/70 tabular-nums">
              {elapsedLabel}
            </div>
          </div>
          <div className="pointer-events-auto">
            <ProgressIndicator
              total={total}
              current={currentIndex}
              results={results.map(result => ({ correct: result.correct }))}
            />
          </div>
        </div>

        {/* Gallery Question Tag - Relatively placed below indicators to adapt to Safe Areas */}
        <div className="mt-4 flex justify-center w-full">
          <div className="px-3.5 py-1.5 font-mono text-label font-light uppercase tracking-label text-muted/80 bg-background/60 backdrop-blur-[1px]">
            <span>Image {currentIndex + 1} of {total}</span>
            <span className="mx-2 text-outline/20">—</span>
            <span>AI or Real?</span>
          </div>
        </div>
      </div>

      {/* ── Committing Pending Loader ── */}
      {isCommitting && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-[1.5px] transition-opacity duration-300">
          <div className="bg-surface border border-border-dim px-8 py-5 flex flex-col items-center gap-3 max-w-[200px]">
            <div className="flex gap-1.5 items-center justify-center">
              <span className="w-1 h-1 bg-outline animate-pulse" />
              <span className="w-1 h-1 bg-outline animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-1 bg-outline animate-pulse [animation-delay:300ms]" />
            </div>
            <div className="font-mono text-label font-medium uppercase tracking-kicker text-foreground text-center">
              {copy.gameplay.commitPending}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating: Bottom Action Panel Overlay ── */}
      <div className="absolute bottom-0 inset-x-0 z-50 pointer-events-none px-4 pb-[calc(env(safe-area-inset-bottom)+1.2rem)] pt-20">
        <div className="pointer-events-auto flex flex-col w-full">
          <SocialTensionHint text={socialHint} />
          <ReasoningTags visible={showReasoningTags} challengeId={challenge.id} onTagSelected={onTagSelected} />
          {phase !== 'investigating' && (
            <div className="mb-3 flex justify-center">
              <span className="border border-border-dim bg-background/60 px-3 py-1.5 font-mono text-label uppercase tracking-label text-muted">
                {copy.gameplay.investigatePrompt}
              </span>
            </div>
          )}
          <DecisionControls disabled={disabled} onDecision={onDecision} />
        </div>
      </div>
    </main>
  );
}
