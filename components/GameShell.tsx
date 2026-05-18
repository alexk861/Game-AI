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
  const isCommitting = !timerRunning && (phase === 'playing' || phase === 'investigating');
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedLabel = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-background cinematic-bg artifact-breath">
      <div className="ambient-field" />
      <div className="relative z-30 flex-shrink-0 pt-[env(safe-area-inset-top)]">
        <Timer key={timerKey} duration={timerDuration} running={timerRunning} onExpire={onTimerExpire} />
        <div className="flex items-center justify-between bg-gradient-to-b from-background/92 via-background/62 to-transparent px-4 pb-6 pt-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted/55">
            UNCANNY
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted/65">
            {elapsedLabel}
          </div>
          <ProgressIndicator
            total={total}
            current={currentIndex}
            results={results.map(result => ({ correct: result.correct }))}
          />
        </div>
      </div>

      <div className="relative -mt-4 flex min-h-0 flex-1 flex-col">
        {/* ── Question label over the image ── */}
        <div className="absolute top-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="bg-background/70 backdrop-blur-sm border border-outline-variant/50 px-4 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted/60">
              Image {currentIndex + 1} of {total}
            </span>
            <span className="mx-2 text-outline-variant/50">—</span>
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground/90 font-medium">
              AI or Real?
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1">
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

        {isCommitting && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/28">
            <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted/55">
              {copy.gameplay.commitPending}
            </div>
          </div>
        )}

        <div className="relative z-20 -mt-24 flex-shrink-0 border-t border-outline-variant/70 bg-gradient-to-b from-background/70 via-background/94 to-background px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-8">
          <SocialTensionHint text={socialHint} />
          <ReasoningTags visible={showReasoningTags} onTagSelected={onTagSelected} />
          <div className="mt-4">
            <DecisionControls disabled={disabled} onDecision={onDecision} />
          </div>
          <div className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted/35">
            {copy.gameplay.investigatePrompt}
          </div>
        </div>
      </div>
    </main>
  );
}
