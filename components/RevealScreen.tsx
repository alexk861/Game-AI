'use client';

import { useState } from 'react';
import type { GuessResult, RevealData } from '@/lib/types';
import { copy, getDynamicTags } from '@/lib/copy';
import Image from 'next/image';

interface RevealScreenProps {
  imageUrl: string;
  challengeId?: string;
  data: RevealData;
  result: GuessResult | null;
  currentIndex: number;
  total: number;
  onNext: () => void;
  onTagSelected?: (tag: string) => void;
}

function getEmotionalSentence(
  isCorrect: boolean,
  isAI: boolean,
  timeTaken: number | null,
  failureRate: number
): string {
  const isHesitant = timeTaken !== null && timeTaken > 5.5;

  if (timeTaken === null) {
    return "Held by uncertainty.";
  }

  if (isCorrect) {
    if (timeTaken < 2.5) {
      return isAI
        ? "Instant perception detected the AI generation."
        : "Instant perception recognized the authentic capture.";
    }
    if (isHesitant) {
      return "Correct in the end, despite hesitation.";
    }
    return isAI
      ? "Spot on. You noticed the AI detail."
      : "Spot on. You recognized the real details.";
  } else {
    if (failureRate > 62) {
      return isAI
        ? "Most players trusted this simulation."
        : "This image misled almost everyone.";
    }
    if (isAI) {
      return "Foiled by a manufactured reality.";
    }
    return "Doubted the authentic photograph.";
  }
}

export default function RevealScreen({
  imageUrl,
  challengeId,
  data,
  result,
  currentIndex,
  total,
  onNext,
  onTagSelected,
}: RevealScreenProps) {
  const isAI = data.answer === 'ai';
  const totalGuesses = data.guesses_ai + data.guesses_real;
  const failureRate = totalGuesses > 0 
    ? Math.round(((isAI ? data.guesses_real : data.guesses_ai) / totalGuesses) * 100) 
    : 0;
  
  const timeRemainingVal = result?.timeRemaining ?? null;
  const timeTaken = result?.guess === 'timeout' 
    ? null 
    : timeRemainingVal !== null 
      ? 12 - timeRemainingVal 
      : null;

  const isCorrect = result?.correct ?? false;
  const isTimeout = result?.guess === 'timeout';

  const emotionalSentence = getEmotionalSentence(
    isCorrect,
    isAI,
    timeTaken,
    failureRate
  );

  const [selectedTag, setSelectedTag] = useState<string | null>(result?.reasoningTag || null);

  const handleTagClick = (tag: string) => {
    if (selectedTag) return; // Prevent changing
    setSelectedTag(tag);
    if (onTagSelected) onTagSelected(tag);
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const isLast = currentIndex + 1 >= total;

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* ── Fullscreen Background Photograph ── */}
      <Image
        src={imageUrl}
        alt="Revealed image"
        fill
        className="object-cover opacity-35"
        draggable={false}
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/85 to-[#0f172a]/50 pointer-events-none" />

      {/* ── Main Content Area ── */}
      <section className="absolute inset-0 z-20 flex flex-col justify-between px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)] max-w-xl mx-auto w-full">
        {/* Top Indicators */}
        <div className="flex justify-between items-center font-mono text-[9px] uppercase tracking-wider text-muted/60">
          <span>Reveal Set</span>
          <span>Image {currentIndex + 1} of {total}</span>
        </div>

        {/* Middle Narrative Panel */}
        <div className="flex flex-col justify-center flex-grow py-8">
          {/* Immediate Verdict Badge */}
          <div className="mb-4">
            {isTimeout ? (
              <span className="inline-block text-[11px] font-sans font-extrabold tracking-widest uppercase text-wrong">
                ⏱️ TIME EXPIRED
              </span>
            ) : isCorrect ? (
              <span className="inline-block text-[11px] font-sans font-extrabold tracking-widest uppercase text-[#10b981]">
                ✓ CORRECT
              </span>
            ) : (
              <span className="inline-block text-[11px] font-sans font-extrabold tracking-widest uppercase text-[#ef4444]">
                ✗ FOOLED
              </span>
            )}
          </div>

          {/* spaced Kicker */}
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-muted/90 mb-3 flex items-center gap-2">
            {isAI ? (
              <>
                <span className="text-[#f59e0b]">⚡</span>
                <span className="text-[#f59e0b]">AI GENERATED</span>
              </>
            ) : (
              <>
                <span className="text-[#10b981]">📷</span>
                <span className="text-[#10b981]">REAL PHOTOGRAPH</span>
              </>
            )}
          </div>

          {/* Emotional Headline */}
          <h1 className="text-2xl sm:text-3xl font-light leading-[1.25] text-foreground tracking-wide font-serif italic mb-6">
            &ldquo;{emotionalSentence}&rdquo;
          </h1>

          {/* Context Details */}
          {data.context_short && (
            <p className="text-sm font-sans font-light text-[#f8fafc] leading-relaxed border-l-2 border-[#f59e0b] pl-4 py-0.5 mb-5">
              {data.context_short}
            </p>
          )}

          {/* AI Prompt or Photographer Credit */}
          <p className="text-xs leading-relaxed text-[#abb1bd] font-light mb-6">
            {isAI ? (
              data.ai_prompt ? (
                <span>Prompt: &ldquo;{data.ai_prompt}&rdquo;</span>
              ) : (
                <span>AI generation.</span>
              )
            ) : (
              data.photographer_name ? (
                <span>Captured by {data.photographer_name}.</span>
              ) : (
                <span>Authentic photograph. Source verified.</span>
              )
            )}
          </p>

          {/* consensus stats */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] text-[#abb1bd]/70 uppercase tracking-wider border-t border-[#334155]/40 pt-4 mb-6">
            {timeTaken !== null && (
              <span>spent: {timeTaken.toFixed(1)}s</span>
            )}
            <span>consensus: {totalGuesses > 0 ? `${100 - failureRate}% correct` : '--%'}</span>
            <span>players: {totalGuesses.toLocaleString()}</span>
          </div>

          {/* Optional Reasoning Tags inside Reveal Screen */}
          <div className="border-t border-[#334155]/40 pt-4">
            <span className="block font-sans text-[10px] text-[#abb1bd]/60 uppercase tracking-widest mb-3">
              Optional: What gave it away?
            </span>
            <div className="flex flex-wrap gap-2">
              {getDynamicTags(challengeId).map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className={`font-sans text-[10px] uppercase tracking-wider px-3.5 py-1.5 border transition-all rounded-[4px] cursor-pointer ${
                      isActive
                        ? 'border-[#f59e0b] text-[#f59e0b] bg-[#f59e0b]/10 font-semibold'
                        : selectedTag !== null
                          ? 'border-transparent text-[#abb1bd]/30 cursor-not-allowed bg-transparent'
                          : 'border-[#334155] text-[#abb1bd] bg-[#1e293b]/30 hover:border-[#abb1bd] hover:bg-[#1e293b]/60'
                    }`}
                    disabled={selectedTag !== null}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions Area */}
        <div className="pt-4 border-t border-[#334155]/40 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-[#0f172a] font-bold text-xs uppercase tracking-widest rounded-[4px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center gap-1 cursor-pointer"
          >
            <span>{isLast ? 'See Results' : 'Next Image'}</span>
            <span className="text-[10px]">➔</span>
          </button>
        </div>
      </section>
    </main>
  );
}
