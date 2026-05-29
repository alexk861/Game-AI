'use client';

import type { GuessResult, RevealData } from '@/lib/types';
import { TIMER_DURATION_SECONDS } from '@/lib/gameConfig';
import Image from 'next/image';

interface RevealScreenProps {
  imageUrl: string;
  data: RevealData;
  result: GuessResult | null;
}

function getEmotionalSentence(
  isCorrect: boolean,
  isAI: boolean,
  timeTaken: number | null,
  failureRate: number
): string {
  const isHesitant = timeTaken !== null && timeTaken > 5.5;

  if (timeTaken === null) {
    return "The uncertainty held you too long.";
  }

  if (isCorrect) {
    if (timeTaken < 2.5) {
      return isAI
        ? "Your instinct immediately detected the simulation."
        : "Your instinct immediately recognized the organic truth.";
    }
    if (isHesitant) {
      return "You hesitated, but saw through it in the end.";
    }
    return isAI
      ? "You noticed something others missed."
      : "You recognized the authentic detail.";
  } else {
    if (failureRate > 62) {
      return isAI
        ? "Most observers trusted this representation."
        : "This image cast doubt in almost everyone.";
    }
    if (isAI) {
      return "You trusted a manufactured reality.";
    }
    return "You doubted the authentic photograph.";
  }
}

export default function RevealScreen({ imageUrl, data, result }: RevealScreenProps) {
  const isAI = data.answer === 'ai';
  const totalGuesses = data.guesses_ai + data.guesses_real;
  const failureRate = totalGuesses > 0 
    ? Math.round(((isAI ? data.guesses_real : data.guesses_ai) / totalGuesses) * 100) 
    : 0;
  
  const timeRemainingVal = result?.timeRemaining ?? null;
  const timeTaken = result?.guess === 'timeout' 
    ? null 
    : timeRemainingVal !== null 
      ? TIMER_DURATION_SECONDS - timeRemainingVal 
      : null;

  const isCorrect = result?.correct ?? false;
  const isTimeout = result?.guess === 'timeout';

  const emotionalSentence = getEmotionalSentence(
    isCorrect,
    isAI,
    timeTaken,
    failureRate
  );

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* ── Fullscreen Background Photograph ── */}
      <Image
        src={imageUrl}
        alt="Revealed visual record"
        fill
        className="object-cover opacity-50 reveal-blur-sharp"
        draggable={false}
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/25 to-transparent" />

      {/* ── Floating content block ── */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-24 pointer-events-none">
        <div className="pointer-events-auto flex flex-col max-w-xl mx-auto w-full">
          
          {/* Immediate Correctness Verdict (0ms) - Borderless pure text indicators */}
          <div className="reveal-verdict-scale mb-4">
            {isTimeout ? (
              <span className="inline-block text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-wrong">
                TIME EXPIRED
              </span>
            ) : isCorrect ? (
              <span className="inline-block text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-correct">
                CORRECT
              </span>
            ) : (
              <span className="inline-block text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-wrong">
                WRONG
              </span>
            )}
          </div>

          {/* 800ms delayed sentence + kicker */}
          <div className="animate-reveal-sentence">
            {/* spaced sans kicker */}
            <div className="font-sans text-[9px] font-light uppercase tracking-[0.24em] text-muted/50 mb-3.5 flex items-center gap-2">
              {isAI ? (
                <>
                  <span className="text-accent-amber/90">⚡</span>
                  <span>SYNTHETIC REPRESENTATION</span>
                </>
              ) : (
                <>
                  <span className="text-correct/90">📷</span>
                  <span>ORGANIC CAPTURE</span>
                </>
              )}
            </div>

            {/* Large dynamic emotional sentence */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-light leading-[1.25] text-foreground tracking-wide font-serif italic mb-6">
              &ldquo;{emotionalSentence}&rdquo;
            </h1>
          </div>

          {/* 1600ms delayed metadata */}
          <div className="animate-reveal-metadata space-y-4">
            <div className="py-0.5 space-y-2 font-sans font-light">
              <p className="text-xs leading-relaxed text-muted/70 max-w-md">
                {isAI ? (
                  data.ai_prompt ? (
                    <span>Prompt: &ldquo;{data.ai_prompt}&rdquo;</span>
                  ) : (
                    <span>Synthetic generation using Midjourney.</span>
                  )
                ) : (
                  data.photographer_name ? (
                    <span>Captured by {data.photographer_name}.</span>
                  ) : (
                    <span>Authentic record. Verifiable source details.</span>
                  )
                )}
              </p>

              {/* Minimal inline stats */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[9px] uppercase tracking-wider text-muted/40">
                {timeTaken !== null && (
                  <span>spent: {timeTaken.toFixed(1)}s</span>
                )}
                <span>consensus: {totalGuesses > 0 ? `${100 - failureRate}% correct` : '--%'}</span>
                <span>observers: {totalGuesses}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Minimalist Next Image loading line at the very bottom edge ── */}
      <div className="absolute bottom-0 inset-x-0 z-30 h-1 bg-white/5 pointer-events-none">
        <div className="reveal-next-bar h-full bg-primary/20" />
      </div>
    </main>
  );
}
