'use client';

import { useState } from 'react';
import type { Challenge, GuessResult } from '@/lib/types';
import { analytics } from '@/lib/analytics';
import { copy, resultReflection } from '@/lib/copy';

interface ResultsDebriefProps {
  results: GuessResult[];
  challenges: Challenge[];
  streak: number;
  setDate: string;
  completionMs: number | null;
}

function comparisonFor(score: number): number {
  return [18, 31, 49, 68, 82, 94][score] ?? 49;
}

export default function ResultsDebrief({ results, challenges, streak, setDate, completionMs }: ResultsDebriefProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const score = results.filter(result => result.correct).length;
  const perceptionPercent = Math.round((score / Math.max(results.length, 1)) * 100);
  const comparison = comparisonFor(score);
  const misleadingIndex = Math.max(0, results.findIndex(result => !result.correct));
  const misleadingChallenge = challenges[misleadingIndex] || challenges[0];
  const selectedResult = results[selectedIndex] || results[0];
  const selectedChallenge = challenges.find(challenge => challenge.id === selectedResult?.challengeId) || challenges[selectedIndex] || challenges[0];
  const selectedImageUrl = selectedResult?.imageUrl || selectedChallenge?.image_url;
  const selectedAnswer = selectedResult?.answer;
  const selectedGuess = selectedResult?.guess;
  const shareMarks = results.map(result => result.guess === 'timeout' ? '0' : result.correct ? '1' : 'x').join('');
  const completionSeconds = completionMs === null ? null : Math.max(0, Math.round(completionMs / 1000));
  const completionLabel = completionSeconds === null
    ? 'not recorded'
    : `${Math.floor(completionSeconds / 60)}:${String(completionSeconds % 60).padStart(2, '0')}`;
  const shareText = `UNCANNY\n${shareMarks} ${score}/5\naccuracy ${perceptionPercent}%\ntime ${completionLabel}\nhttps://game-ai-one.vercel.app`;

  const handleShare = async () => {
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    analytics.shareTapped(score, canShare ? 'native' : 'copy');

    if (canShare) {
      try {
        await navigator.share({ title: 'UNCANNY / DAILY RECORD', text: shareText });
      } catch {
        // User cancelled share.
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      const button = document.getElementById('share-btn');
      if (button) {
        button.textContent = copy.cta.exported;
        setTimeout(() => { button.textContent = copy.cta.export; }, 1800);
      }
    }
  };

  const handleRestartTest = () => {
    localStorage.removeItem('uncanny_state');
    window.location.reload();
  };

  return (
    <main className="h-[100dvh] overflow-x-hidden overflow-y-auto bg-background text-foreground cinematic-bg">
      <div className="noise-overlay" />
      <section className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted/45">
          <span>{copy.results.label}</span>
          <span className="shrink-0">{setDate}</span>
        </div>

        <div className="mt-9 md:mt-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted/50 mb-4">
            {copy.results.metric}
          </div>
          <div className="mt-2 flex flex-col gap-6 border-l-2 border-outline-variant pl-6 py-2">
            <p className="max-w-sm text-xl sm:text-2xl leading-snug text-on-surface font-semibold italic">
              &quot;{resultReflection(score)}&quot;
            </p>
            <div className="flex items-center gap-4">
              <div className="font-mono text-xs uppercase text-outline tracking-widest">Confidence Index:</div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-mono text-outline leading-none">{perceptionPercent}</span>
                <span className="pb-0.5 text-sm font-mono text-muted/40">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-l border-outline/70 pl-4">
          <p className="text-base leading-relaxed text-muted">
            {copy.results.comparison(comparison)}
          </p>
          {streak > 0 && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted/45">
              {copy.results.recurrence(streak)}
            </p>
          )}
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted/45">
            {copy.results.exposure(completionLabel)}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted/35">
            {copy.results.sample}
          </p>
        </div>

        {misleadingChallenge && (
          <div className="mt-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted/50">
              {copy.results.misleading}
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-[5.5rem_1fr]">
              <div className="relative aspect-[16/10] w-full overflow-hidden border border-outline-variant bg-surface md:aspect-[4/5] md:w-auto">
                <img
                  src={misleadingChallenge.image_url}
                  alt="Most misleading visual"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              <p className="min-w-0 self-center text-sm leading-relaxed text-muted/72">
                {copy.results.misleadingNote}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted/50">
            {copy.results.marks}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
            {results.map((result, index) => (
              <button
                type="button"
                key={`${result.challengeId}-${index}`}
                onClick={() => setSelectedIndex(index)}
                className={`min-w-0 border px-1.5 py-3 text-center font-mono text-[10px] uppercase tracking-normal active:translate-y-px sm:px-2 sm:text-xs ${
                  selectedIndex === index
                    ? 'border-foreground text-foreground'
                    : result.guess === 'timeout'
                      ? 'border-outline-variant text-muted/45'
                      : result.correct
                        ? 'border-outline text-muted'
                        : 'border-ai text-ai'
                }`}
              >
                {copy.results.mark(result)}
              </button>
            ))}
          </div>
        </div>

        {selectedResult && selectedImageUrl && (
          <div className="mt-6 border border-outline-variant bg-background/45">
            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_12rem]">
              <div className="relative aspect-[16/10] overflow-hidden bg-surface md:aspect-auto md:min-h-44">
                <img
                  src={selectedImageUrl}
                  alt="Selected classification frame"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              <div className="border-t border-outline-variant p-4 md:border-l md:border-t-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted/45">
                  {copy.results.selectedFrame(selectedIndex)}
                </div>
                <div className="mt-4 grid gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted/60">
                  <div>
                    <span className="block text-muted/35">{copy.results.input}</span>
                    <span className="mt-1 block text-foreground">
                      {selectedGuess === 'timeout' ? copy.results.mark(selectedResult) : selectedGuess === 'real' ? copy.gameplay.real : copy.gameplay.ai}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted/35">{copy.results.sourceClass}</span>
                    <span className="mt-1 block text-foreground">
                      {selectedAnswer === undefined ? copy.results.unavailable : selectedAnswer === 'real' ? copy.gameplay.real : copy.gameplay.ai}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted/35">{copy.results.markLabel}</span>
                    <span className={selectedResult.correct ? 'mt-1 block text-foreground' : 'mt-1 block text-ai'}>
                      {copy.results.mark(selectedResult)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 pt-8 md:mt-auto md:gap-3 pb-8">
          <button
            id="share-btn"
            type="button"
            onClick={handleShare}
            className="w-full border border-outline bg-foreground px-5 py-5 text-left text-background active:translate-y-px"
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-background/65 mb-1">
              {copy.cta.export}
            </span>
            <span className="block min-w-0 text-lg sm:text-xl">Share results</span>
          </button>
          
          <div className="grid gap-4 md:grid-cols-2 md:gap-3">
            <a
              href="/profile"
              className="min-w-0 border border-outline-variant px-4 py-4 text-center font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-foreground transition-colors"
            >
              View Record
            </a>
            <a
              href="/leaderboard"
              className="min-w-0 border border-outline-variant px-4 py-4 text-center font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-foreground transition-colors"
            >
              Compare Observers
            </a>
          </div>

          <div className="mt-4 border-t border-outline-variant/50 pt-6 text-center">
            <p className="text-sm leading-relaxed text-muted/65">
              Today's set is complete. The archive will refresh tomorrow.
            </p>
          </div>
          
          {/* Debug restart button */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleRestartTest}
                className="border border-ai/60 px-4 py-2 text-center text-xs font-mono text-ai active:translate-y-px"
              >
                {copy.cta.restart}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
