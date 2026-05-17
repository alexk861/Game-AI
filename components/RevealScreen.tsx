'use client';

import type { GuessResult, RevealData } from '@/lib/types';
import { copy, revealConsensus, revealOrigin } from '@/lib/copy';

interface RevealScreenProps {
  imageUrl: string;
  data: RevealData;
  result: GuessResult | null;
}

export default function RevealScreen({ imageUrl, data, result }: RevealScreenProps) {
  const answerText = data.answer === 'real' ? copy.reveal.real : copy.reveal.ai;
  const verdict = result?.guess === 'timeout'
    ? copy.reveal.timeout
    : data.correct
      ? copy.reveal.correct
      : copy.reveal.wrong;
  const origin = revealOrigin(data);

  const totalGuesses = data.guesses_ai + data.guesses_real;
  const failureRate = totalGuesses > 0 
    ? Math.round(((data.answer === 'ai' ? data.guesses_real : data.guesses_ai) / totalGuesses) * 100) 
    : 0;
  
  // Game loop allows 10 seconds (10000ms). The `timeRemaining` is passed from SwipeCard.
  const timeTaken = result?.timeRemaining !== undefined ? (10000 - result.timeRemaining) / 1000 : null;
  const isFast = timeTaken !== null && timeTaken < 2.5;

  return (
    <main className="relative grid h-[100dvh] grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-background cinematic-bg reveal-breath animate-in fade-in duration-500">
      <div className="ambient-field" />
      <section className="relative min-h-0 overflow-hidden">
        <img
          src={imageUrl}
          alt="Revealed visual record"
          className="absolute inset-0 h-full w-full object-cover opacity-86"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(19,19,19,0.28),rgba(19,19,19,0.06)_38%,rgba(19,19,19,0.92))]" />
        <div className="analog-drift absolute inset-0 pointer-events-none" />
        <div className="noise-overlay" />
      </section>

      <section className="relative z-10 border-t border-outline-variant/70 bg-background/96 px-5 pb-[calc(env(safe-area-inset-bottom)+1.6rem)] pt-8 reveal-flash">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted/50">
          {copy.reveal.label}
        </div>
        <h1 className="mt-4 max-w-[18rem] text-4xl font-normal leading-[0.98] text-foreground">
          {answerText}
        </h1>
        <p className="mt-5 max-w-sm text-lg leading-snug text-muted">
          {verdict}
        </p>
        <div className="mt-7 border-l border-outline/70 pl-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] leading-relaxed text-muted/55">
            {revealConsensus(data)}
          </p>

          <div className="mt-5 mb-5 grid gap-3 border-y border-outline-variant/40 py-4 max-w-xs">
            {timeTaken !== null && (
              <div className="flex justify-between items-center font-mono text-[10px] uppercase text-outline">
                <span>YOUR REACTION:</span>
                <span className={isFast ? "text-primary font-bold" : ""}>
                  {timeTaken.toFixed(1)}S {isFast && <span className="text-error animate-pulse ml-1 tracking-widest">(FAST)</span>}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center font-mono text-[10px] uppercase text-outline">
              <span>GLOBAL FAILURE RATE:</span>
              <span className={failureRate > 50 ? "text-error" : ""}>
                {totalGuesses > 0 ? `${failureRate}%` : '--%'}
              </span>
            </div>
            
            <div className="flex justify-between items-center font-mono text-[10px] uppercase text-outline">
              <span>TOTAL OBSERVERS:</span>
              <span>{totalGuesses}</span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted/72">
            {origin}
          </p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted/38">
            {data.answer === 'real' ? 'source: real' : 'source: AI'}
          </p>
        </div>
      </section>
    </main>
  );
}
