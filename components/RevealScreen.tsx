'use client';

import type { GuessResult, RevealData } from '@/lib/types';
import { copy, revealConsensus, revealOrigin } from '@/lib/copy';
import { TIMER_DURATION_SECONDS } from '@/lib/gameConfig';

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
  
  const timeTaken = result?.timeRemaining !== undefined ? TIMER_DURATION_SECONDS - result.timeRemaining : null;
  const isFast = timeTaken !== null && timeTaken < 2.5;

  const isAI = data.answer === 'ai';

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

        {/* ── SOURCE BADGE: Large, unmissable AI/REAL indicator ── */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className={`reveal-source-badge px-8 py-4 border-2 ${
            isAI
              ? 'border-error/80 bg-error/15 backdrop-blur-sm'
              : 'border-muted/60 bg-muted/10 backdrop-blur-sm'
          }`}>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-center mb-1 opacity-60">
              this image was
            </div>
            <div className={`font-mono text-3xl font-bold uppercase tracking-[0.2em] text-center ${
              isAI ? 'text-error' : 'text-foreground'
            }`}>
              {isAI ? '⚡ AI GENERATED' : '📷 REAL PHOTO'}
            </div>
          </div>
        </div>

        {/* Corner source badge */}
        <div className={`absolute top-4 right-4 z-20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] ${
          isAI
            ? 'bg-error/20 border border-error/50 text-error'
            : 'bg-muted/15 border border-muted/40 text-muted'
        }`}>
          {isAI ? 'AI' : 'REAL'}
        </div>
      </section>

      <section className="relative z-10 border-t border-outline-variant/70 bg-background/96 px-5 pb-[calc(env(safe-area-inset-bottom)+1.6rem)] pt-6 reveal-flash">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted/50">
          {copy.reveal.label}
        </div>
        <h1 className="mt-3 max-w-[18rem] text-3xl font-normal leading-[0.98] text-foreground">
          {answerText}
        </h1>
        <p className={`mt-3 max-w-sm text-base leading-snug ${
          data.correct ? 'text-muted' : 'text-wrong/90'
        }`}>
          {verdict}
        </p>
        <div className="mt-5 border-l border-outline/70 pl-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] leading-relaxed text-muted/55">
            {revealConsensus(data)}
          </p>

          <div className="mt-4 mb-4 grid gap-2.5 border-y border-outline-variant/40 py-3 max-w-xs">
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

          <p className="mt-3 text-sm leading-relaxed text-muted/72">
            {origin}
          </p>
        </div>

        {/* ── NEXT IMAGE LOADING indicator ── */}
        <div className="mt-5 pt-4 border-t border-outline-variant/30">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/50">
              Next image loading…
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/40 reveal-next-dots">
              ●●●
            </span>
          </div>
          <div className="w-full h-1 bg-white/8 overflow-hidden rounded-full">
            <div className="reveal-next-bar h-full bg-outline/60" />
          </div>
        </div>
      </section>
    </main>
  );
}
