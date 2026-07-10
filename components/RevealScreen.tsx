'use client';

import { useState } from 'react';
import type { GuessResult, RevealData } from '@/lib/types';
import { copy, getDynamicTags } from '@/lib/copy';
import VerdictStamp from '@/components/VerdictStamp';
import CrowdSplitBar from '@/components/CrowdSplitBar';
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
        className="object-cover opacity-80"
        draggable={false}
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20 pointer-events-none" />

      {/* ── Verdict Stamp on the image ── */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+4.5rem)] inset-x-0 z-20 flex justify-center pointer-events-none">
        <VerdictStamp answer={data.answer} />
      </div>

      {/* ── Main Content Area ── */}
      <section className="absolute inset-0 z-20 flex flex-col justify-between px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)] max-w-xl mx-auto w-full">
        {/* Top Indicators */}
        <div className="flex justify-between items-center font-mono text-label uppercase tracking-label text-muted/60">
          <span>Reveal Set</span>
          <span>Image {currentIndex + 1} of {total}</span>
        </div>

        {/* Middle Narrative Panel */}
        <div className="flex flex-col justify-end flex-grow py-8">
          {/* Immediate Verdict Badge */}
          <div className="mb-4">
            {isTimeout ? (
              <span className="inline-block font-mono text-label-lg font-bold tracking-label uppercase text-wrong">
                TIME EXPIRED
              </span>
            ) : isCorrect ? (
              <span className="inline-block font-mono text-label-lg font-bold tracking-label uppercase text-real">
                CORRECT
              </span>
            ) : (
              <span className="inline-block font-mono text-label-lg font-bold tracking-label uppercase text-wrong">
                FOOLED
              </span>
            )}
          </div>

          {/* spaced Kicker */}
          <div className={`font-mono text-label font-semibold uppercase tracking-label mb-3 ${isAI ? 'text-wrong' : 'text-real'}`}>
            {isAI ? 'AI GENERATED' : 'REAL PHOTOGRAPH'}
          </div>

          {/* Emotional Headline */}
          <h1 className="text-2xl sm:text-3xl font-sans font-light leading-[1.25] text-foreground tracking-wide mb-6">
            {emotionalSentence}
          </h1>

          {/* The Giveaway */}
          {data.context_short && (
            <div className="border-l border-border-dim pl-4 py-0.5 mb-5">
              <span className="block font-mono text-label uppercase tracking-label text-muted/80 mb-1">
                {copy.reveal.giveaway}
              </span>
              <p className="text-sm font-sans font-light text-foreground leading-relaxed">
                {data.context_short}
              </p>
            </div>
          )}

          {/* AI Prompt or Photographer Credit */}
          <p className="text-xs leading-relaxed text-muted font-light mb-6">
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

          {/* Crowd split */}
          <div className="border-t border-border-dim/60 pt-4 mb-6">
            <CrowdSplitBar guessesAi={data.guesses_ai} guessesReal={data.guesses_real} answer={data.answer} />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-label text-muted/70 uppercase tracking-label">
              {timeTaken !== null && (
                <span>spent: {timeTaken.toFixed(1)}s</span>
              )}
              <span>players: {totalGuesses.toLocaleString()}</span>
            </div>
          </div>

          {/* Optional Reasoning Tags inside Reveal Screen */}
          <div className="border-t border-border-dim/60 pt-4">
            <span className="block font-mono text-label text-muted/60 uppercase tracking-label mb-3">
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
                    className={`font-mono text-label uppercase tracking-label px-3.5 py-1.5 border transition-all cursor-pointer ${
                      isActive
                        ? 'border-foreground text-background bg-foreground font-semibold'
                        : selectedTag !== null
                          ? 'border-transparent text-muted/30 cursor-not-allowed bg-transparent'
                          : 'border-border-dim text-muted bg-surface/40 hover:border-outline hover:bg-surface/70 active:border-outline active:bg-surface/70'
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
        <div className="pt-4 border-t border-border-dim/60">
          <button
            type="button"
            onClick={onNext}
            className="w-full min-h-14 px-6 py-3 bg-primary text-background font-mono font-bold text-label-lg uppercase tracking-caps transition-all hover:bg-primary/90 active:bg-primary/90 active:scale-[0.99] cursor-pointer"
          >
            {isLast ? copy.reveal.seeResults : copy.reveal.next}
          </button>
        </div>
      </section>
    </main>
  );
}
