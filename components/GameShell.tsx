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
      <div className="absolute bottom-0 inset-x-0 z-20 h-72 bg-gradient-to-t from-[#1f2126] via-[#1f2126]/75 to-transparent pointer-events-none" />

      {/* ── Floating: Top Navigation Overlay ── */}
      <div className="absolute top-0 inset-x-0 z-30 pointer-events-none flex flex-col pt-[env(safe-area-inset-top)]">
        <div className="pointer-events-auto">
          {!zenMode ? (
            <Timer key={timerKey} duration={timerDuration} running={timerRunning} onExpire={onTimerExpire} />
          ) : (
            <div className="h-1 bg-outline/5 w-full" />
          )}
        </div>
        <div className="flex items-center justify-between px-4 pt-2">
          <div className="font-sans text-[10px] font-light uppercase tracking-[0.24em] text-muted/65">
            UNCANNY
          </div>
          <div className="font-sans text-[11px] font-light uppercase tracking-[0.18em] text-muted/70">
            {elapsedLabel}
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
          <div className="px-3.5 py-1.5 font-sans text-[10px] font-light uppercase tracking-[0.18em] text-muted/80 bg-background/30 backdrop-blur-[1px] rounded-[2px]">
            <span>Image {currentIndex + 1} of {total}</span>
            <span className="mx-2 text-outline/20">—</span>
            <span>AI or Real?</span>
          </div>
        </div>
      </div>

      {/* ── Committing Pending Loader ── */}
      {isCommitting && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-[1.5px] transition-opacity duration-300">
          <div className="bg-[#1f2126]/95 border border-[#f0ece9]/25 shadow-2xl px-8 py-5 rounded-[4px] flex flex-col items-center gap-3 max-w-[200px]">
            <div className="flex gap-1.5 items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#c8963e] rounded-full animate-ping" />
              <span className="w-1.5 h-1.5 bg-[#c8963e] rounded-full animate-pulse" />
              <span className="w-1.5 h-1.5 bg-[#c8963e] rounded-full animate-ping" />
            </div>
            <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.28em] text-[#f0ece9] text-center">
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
          <div className="mt-4">
            <DecisionControls disabled={disabled} onDecision={onDecision} />
          </div>
          <div className="mt-3 text-center font-sans text-[9px] font-light uppercase tracking-[0.16em] text-muted/50">
            {copy.gameplay.investigatePrompt}
          </div>
        </div>
      </div>
    </main>
  );
}
