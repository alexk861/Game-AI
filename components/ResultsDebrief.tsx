'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Challenge, GuessResult } from '@/lib/types';
import { analytics } from '@/lib/analytics';
import { copy, resultReflection, speedObservation, reasoningInsight } from '@/lib/copy';
import { TIMER_DURATION_SECONDS } from '@/lib/gameConfig';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import CalmAdTransitionOverlay from './CalmAdTransitionOverlay';
import Image from 'next/image';

interface ResultsDebriefProps {
  results: GuessResult[];
  challenges: Challenge[];
  streak: number;
  setDate: string;
  completionMs: number | null;
  onUnlockExtraPlay?: () => void;
  onRequestReflection?: () => void;
  adAlreadyUnlocked?: boolean;
  reflectionLevel?: number;
  lastReflectionUnlockAt?: string | null;
  isChallengePlay?: boolean;
}

function comparisonFor(score: number): number {
  return [18, 31, 49, 68, 82, 94][score] ?? 49;
}

function getSelectionNarrative(result: GuessResult): string {
  const isAI = result.answer 
    ? result.answer === 'ai'
    : result.guess === 'real'
      ? !result.correct
      : result.correct;

  const noted = result.reasoningTag ? ` You noted the ${result.reasoningTag.toLowerCase()}.` : '';

  if (result.guess === 'timeout') {
    return `You were held by uncertainty until time expired. The record was ${isAI ? 'synthetic' : 'organic'}.${noted}`;
  }

  if (result.correct) {
    return isAI
      ? `Your instinct immediately detected the synthetic representation.${noted}`
      : `Your instinct immediately recognized the organic capture.${noted}`;
  } else {
    return isAI
      ? `You trusted the synthetic representation as authentic.${noted}`
      : `You doubted the organic capture, perceiving it as synthetic.${noted}`;
  }
}

export default function ResultsDebrief({
  results,
  challenges,
  streak,
  setDate,
  completionMs,
  onUnlockExtraPlay,
  onRequestReflection,
  adAlreadyUnlocked = false,
  reflectionLevel = 0,
  lastReflectionUnlockAt = null,
  isChallengePlay = false,
}: ResultsDebriefProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [adWatched, setAdWatched] = useState(false);

  const handleExtraPlayReward = useCallback(() => {
    setAdWatched(true);
    if (onUnlockExtraPlay) onUnlockExtraPlay();
  }, [onUnlockExtraPlay]);

  const { triggerAd: triggerExtraPlayAd, adPlaying, showOverlay, overlayPhase } = useRewardedAd(handleExtraPlayReward);

  const handleWatchAndReplay = useCallback(() => {
    triggerExtraPlayAd();
  }, [triggerExtraPlayAd]);

  useEffect(() => {
    if (!lastReflectionUnlockAt) {
      setCooldownRemaining(0);
      return;
    }
    const checkCooldown = () => {
      const elapsed = Date.now() - new Date(lastReflectionUnlockAt).getTime();
      const remaining = Math.max(0, Math.ceil((20000 - elapsed) / 1000));
      setCooldownRemaining(remaining);
      return remaining;
    };

    const remaining = checkCooldown();
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      const rem = checkCooldown();
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [lastReflectionUnlockAt]);
  const score = results.filter(result => result.correct).length;
  const perceptionPercent = Math.round((score / Math.max(results.length, 1)) * 100);
  const comparison = comparisonFor(score);
  const misleadingIndex = Math.max(0, results.findIndex(result => !result.correct));
  const misleadingChallenge = challenges[misleadingIndex] || challenges[0];
  const speedObs = speedObservation(results, TIMER_DURATION_SECONDS);
  const tagInsight = reasoningInsight(results);
  const selectedResult = results[selectedIndex] || results[0];
  const selectedChallenge = challenges.find(challenge => challenge.id === selectedResult?.challengeId) || challenges[selectedIndex] || challenges[0];
  const selectedImageUrl = selectedResult?.imageUrl || selectedChallenge?.image_url;
  const completionSeconds = completionMs === null ? null : Math.max(0, Math.round(completionMs / 1000));
  const completionLabel = completionSeconds === null
    ? 'not recorded'
    : `${Math.floor(completionSeconds / 60)}:${String(completionSeconds % 60).padStart(2, '0')}`;
  const formatSetDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}.${parts[2]}`; // MM.DD
    }
    return dateStr;
  };

  const shareMarks = results
    .map(result => {
      if (result.guess === 'timeout') return '⬚';
      return result.correct ? '▣' : '☒';
    })
    .join(' ');

  const dateFormatted = formatSetDate(setDate);
  const targetDate = setDate || new Date().toISOString().split('T')[0];
  const message = resultReflection(score);
  const shareText = `UNCANNY\n${dateFormatted} · ${score}/5\n\n${shareMarks}\n\n${message}\nPlay the same set:\nhttps://game-ai-one.vercel.app/?set=${targetDate}`;

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
        button.textContent = 'Copied.';
        setTimeout(() => { button.textContent = copy.cta.export; }, 1800);
      }
    }
  };

  return (
    <main className="h-[100dvh] overflow-x-hidden overflow-y-auto bg-background text-foreground">
      <section className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-4 font-sans text-[9px] font-light uppercase tracking-[0.18em] text-muted/45">
          <span>{copy.results.label}</span>
          <span className="shrink-0">{setDate}</span>
        </div>

        <div className="mt-9 md:mt-10">
          <div className="font-sans text-[9px] font-light uppercase tracking-[0.18em] text-muted/45 mb-4">
            {copy.results.metric}
          </div>
          <div className="mt-2 flex flex-col gap-4 py-1">
            <p className="max-w-sm text-xl sm:text-2xl leading-snug text-on-surface font-light font-serif italic">
              &quot;{resultReflection(score)}&quot;
            </p>
            <div className="flex items-center gap-3">
              <span className="font-sans text-[10px] font-light uppercase text-muted/40 tracking-wider">Confidence Index:</span>
              <div className="flex items-end gap-0.5">
                <span className="text-xl font-sans text-foreground leading-none font-light">{perceptionPercent}</span>
                <span className="pb-0.5 text-[9px] font-sans text-muted/40">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Editorial Narrative Zone ── */}
        <div className="mt-10">
          <p className="text-sm leading-relaxed text-muted/85 font-sans font-light">
            Your perception has aligned with <span className="text-foreground font-medium">{comparison}%</span> of other observers in today&apos;s visual registry. You resolved these five records in <span className="text-foreground font-medium">{completionLabel}</span>. {speedObs} {tagInsight ? `${tagInsight}.` : ''} {streak > 0 ? `Active streak: ${streak} consecutive ${streak === 1 ? 'day' : 'days'}.` : ''}
          </p>
        </div>

        {/* ── Misleading Image block (Borderless and integrated) ── */}
        {misleadingChallenge && (
          <div className="mt-10">
            <div className="font-sans text-[9px] font-light uppercase tracking-[0.18em] text-muted/45 mb-3.5">
              {copy.results.misleading}
            </div>
            <div className="grid gap-5 sm:grid-cols-[6rem_1fr] items-center">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface rounded-[2px] sm:aspect-[4/5] sm:w-24">
                <Image
                  src={misleadingChallenge.image_url}
                  alt="Most misleading visual"
                  fill
                  className="object-cover opacity-90"
                  draggable={false}
                  sizes="(max-width: 768px) 100vw, 96px"
                />
              </div>
              <p className="min-w-0 text-xs leading-relaxed text-muted/65 font-sans font-light max-w-md">
                {copy.results.misleadingNote}
              </p>
            </div>
          </div>
        )}

        {/* ── Selection index button row ── */}
        <div className="mt-10">
          <div className="font-sans text-[9px] font-light uppercase tracking-[0.18em] text-muted/45 mb-4">
            {copy.results.marks}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {results.map((result, index) => {
              const isSelected = selectedIndex === index;
              const status = result.guess === 'timeout'
                ? 'Skipped'
                : result.correct
                  ? 'Correct'
                  : 'Fooled';
              
              const statusColor = result.guess === 'timeout'
                ? 'text-muted/30'
                : result.correct
                  ? 'text-correct/70'
                  : 'text-wrong/70';

              return (
                <button
                  type="button"
                  key={`${result.challengeId}-${index}`}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex flex-col items-center min-w-0 py-2.5 text-center transition-all duration-150 rounded-[3px] cursor-pointer ${
                    isSelected
                      ? 'text-foreground font-medium'
                      : 'text-muted/50 hover:text-muted/70'
                  }`}
                >
                  <span className="font-sans text-xs font-light">0{index + 1}</span>
                  <span className={`text-[8px] uppercase tracking-wider mt-1 ${statusColor}`}>
                    {status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected Challenge Detail (Borderless observation narrative) ── */}
        {selectedResult && selectedImageUrl && (
          <div className="mt-8 pb-4">
            <div className="grid gap-6 sm:grid-cols-[1fr_13rem] items-start">
              <div className="relative aspect-[16/10] overflow-hidden bg-surface rounded-[2px] sm:aspect-[16/10] sm:h-28">
                <Image
                  src={selectedImageUrl}
                  alt="Selected classification frame"
                  fill
                  className="object-cover opacity-90"
                  draggable={false}
                  sizes="(max-width: 768px) 100vw, 208px"
                />
              </div>
              <div className="py-1">
                <div className="font-sans text-[9px] font-light uppercase tracking-[0.18em] text-muted/45">
                  {copy.results.selectedFrame(selectedIndex)}
                </div>
                <p className="mt-3.5 text-sm font-sans font-light leading-relaxed text-muted max-w-sm">
                  {getSelectionNarrative(selectedResult)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 mt-8 pb-8">
          <button
            id="share-btn"
            type="button"
            onClick={handleShare}
            className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all py-4 text-center font-sans text-xs uppercase tracking-[0.15em] font-medium rounded-[3px] active:scale-[0.985] cursor-pointer"
          >
            {copy.cta.export}
          </button>

          {!isChallengePlay && onUnlockExtraPlay && !adWatched && (
            <button
              type="button"
              disabled={adPlaying}
              onClick={handleWatchAndReplay}
              className="w-full border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/5 transition-all py-4 text-center font-sans text-xs uppercase tracking-[0.15em] font-light rounded-[3px] active:scale-[0.985] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adPlaying ? 'Playing…' : '▶ Watch & Play Again'}
            </button>
          )}

          {showOverlay && <CalmAdTransitionOverlay state={overlayPhase} />}
          
          <div className="grid gap-3 grid-cols-2">
            <a
              href="/profile"
              className="min-w-0 border border-outline/10 py-3.5 text-center font-sans text-xs uppercase tracking-[0.12em] text-muted hover:text-foreground hover:bg-white/5 transition-all rounded-[3px]"
            >
              View Record
            </a>
            <a
              href="/leaderboard"
              className="min-w-0 border border-outline/10 py-3.5 text-center font-sans text-xs uppercase tracking-[0.12em] text-muted hover:text-foreground hover:bg-white/5 transition-all rounded-[3px]"
            >
              Observers
            </a>
          </div>

          {!isChallengePlay && !adAlreadyUnlocked && onRequestReflection && reflectionLevel < 3 && (
            <div className="mt-4 border-t border-outline/5 pt-6 flex flex-col items-center">
              <button
                type="button"
                disabled={cooldownRemaining > 0}
                onClick={onRequestReflection}
                className={`w-full border py-3.5 px-8 font-sans text-[10px] font-light uppercase tracking-[0.15em] transition-all text-center rounded-[2px] ${
                  cooldownRemaining > 0
                    ? 'border-outline/10 text-muted/35 cursor-not-allowed bg-transparent'
                    : 'border-accent-amber/25 hover:border-accent-amber/50 text-accent-amber hover:bg-white/2 cursor-pointer'
                }`}
              >
                {cooldownRemaining > 0 ? 'Allow the archive to stabilize.' : reflectionLevel === 1 ? 'Continue Observation' : reflectionLevel === 2 ? 'One final unstable record remains.' : 'Request Reflection'}
              </button>
              <p className="text-[9px] font-sans font-light tracking-wide text-muted/30 mt-3 text-center">
                {cooldownRemaining > 0
                  ? `Neural pathways stabilizing... (${cooldownRemaining}s remaining)`
                  : reflectionLevel === 1
                    ? 'Two unstable records remain.'
                    : reflectionLevel === 2
                      ? 'This archive was not intended for prolonged observation.'
                      : 'Observe another sequence. A sponsor-supported reflection will play.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
