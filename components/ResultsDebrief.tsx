'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Challenge, GuessResult } from '@/lib/types';
import { analytics } from '@/lib/analytics';
import { copy, resultReflection, speedObservation, reasoningInsight } from '@/lib/copy';
import { TIMER_DURATION_SECONDS, puzzleNumberFor, msUntilNextSetUtc } from '@/lib/gameConfig';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import CalmAdTransitionOverlay from './CalmAdTransitionOverlay';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { getDeviceId } from '@/lib/storage';

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
  isFallbackSet?: boolean;
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
    return `You hesitated until the timer expired. The image was ${isAI ? 'AI-generated' : 'a real photograph'}.${noted}`;
  }

  if (result.correct) {
    return isAI
      ? `Your instinct immediately detected the AI generation.${noted}`
      : `Your instinct immediately recognized the real photograph.${noted}`;
  } else {
    return isAI
      ? `You trusted the AI generation as a real photograph.${noted}`
      : `You doubted the real photograph, guessing it was AI.${noted}`;
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
  isFallbackSet = false,
}: ResultsDebriefProps) {
  const searchParams = useSearchParams();
  const rawChallengerName = searchParams ? searchParams.get('ref') : null;
  const challengerName = rawChallengerName ? rawChallengerName.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 20) : null;
  const challengerScoreStr = searchParams ? searchParams.get('score') : null;
  const parsedScore = challengerScoreStr ? parseInt(challengerScoreStr, 10) : null;
  const challengerScore = (parsedScore !== null && !isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 5) ? parsedScore : null;

  const deviceId = getDeviceId();
  const defaultDisplayName = `Player ${deviceId.slice(-4)}`;
  const score = results.filter(result => result.correct).length;

  const [copiedStatus, setCopiedStatus] = useState(false);
  const [leaderboardName, setLeaderboardName] = useState('');

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [adWatched, setAdWatched] = useState(false);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [playerAttempt, setPlayerAttempt] = useState<any | null>(null);

  const fetchStandings = useCallback(async () => {
    if (isFallbackSet) {
      setLoadingLeaderboard(false);
      return;
    }
    try {
      setLoadingLeaderboard(true);
      const res = await fetch(`/api/challenge-leaderboard?set=${setDate}&device_id=${deviceId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setPlayerRank(data.playerRank);
        setPlayerAttempt(data.playerAttempt);
        if (data.playerAttempt) {
          setHasSubmittedScore(true);
          setLeaderboardName(data.playerAttempt.display_name || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard standings:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [setDate, deviceId, isFallbackSet]);

  useEffect(() => {
    void fetchStandings();
  }, [fetchStandings]);

  useEffect(() => {
    if (!isFallbackSet && challenges.length === 5) {
      analytics.shareModuleViewed(score);
    }
  }, [isFallbackSet, challenges.length, score]);

  const handleSubmitScore = async () => {
    if (submittingScore || isFallbackSet) return;
    try {
      setSubmittingScore(true);
      const cleanName = (leaderboardName.trim() || defaultDisplayName).slice(0, 20);
      
      const guessesPayload = results.map(r => ({
        challengeId: r.challengeId,
        guess: r.guess === 'timeout' ? 'ai' : r.guess,
        is_timeout: r.guess === 'timeout'
      }));

      const res = await fetch('/api/challenge-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          set_date: setDate,
          device_id: deviceId,
          display_name: cleanName,
          guesses: guessesPayload,
          completion_ms: completionMs || 0
        })
      });

      if (res.ok) {
        setHasSubmittedScore(true);
        if (analytics && (analytics as any).track) {
          (analytics as any).track('leaderboard_submitted', { score, completion_ms: completionMs || 0, set_date: setDate });
        }
        await fetchStandings();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to add score.');
      }
    } catch (err) {
      console.error('Failed to submit leaderboard attempt:', err);
    } finally {
      setSubmittingScore(false);
    }
  };

  const formatTime = (ms: number | null) => {
    if (ms === null || ms === undefined) return '--:--';
    const seconds = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

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

  // Countdown to the next daily set (UTC midnight); hidden for challenge/fallback play
  const [nextSetMs, setNextSetMs] = useState<number | null>(null);
  useEffect(() => {
    if (isChallengePlay || isFallbackSet) return;
    const tick = () => setNextSetMs(msUntilNextSetUtc());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isChallengePlay, isFallbackSet]);

  const nextSetLabel = (() => {
    if (nextSetMs === null) return null;
    const totalSeconds = Math.max(0, Math.floor(nextSetMs / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  const puzzleNumber = setDate ? puzzleNumberFor(setDate) : null;
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

  const getShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.uncanny.info';
    return `${origin}/challenge/${targetDate}`;
  };

  const shareHeader = puzzleNumber ? `UNCANNY #${puzzleNumber} · ${score}/5` : `UNCANNY · ${score}/5`;

  const getShareText = () => {
    if (isChallengePlay) {
      return `${shareHeader}\n\nI played your challenge.\nCan you beat this?\n\n${shareMarks}\n\nPlay the same set:\n${getShareLink()}`;
    }
    return `${shareHeader}\n\nCan you tell real from AI?\n\n${shareMarks}\n\nPlay the same set:\n${getShareLink()}`;
  };

  const handleShare = async () => {
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    const text = getShareText();
    analytics.shareTapped(score, canShare ? 'native' : 'copy');

    if (canShare) {
      try {
        await navigator.share({ title: 'UNCANNY / CHALLENGE', text });
        if (analytics && analytics.shareNativeSuccess) {
          analytics.shareNativeSuccess(score);
        }
      } catch {
        if (analytics && analytics.shareFailed) {
          analytics.shareFailed(score);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedStatus(true);
        if (analytics && analytics.shareCopySuccess) {
          analytics.shareCopySuccess(score);
        }
        setTimeout(() => setCopiedStatus(false), 1800);
      } catch {
        if (analytics && analytics.shareFailed) {
          analytics.shareFailed(score);
        }
      }
    }
  };

  const handleCopyOnly = async () => {
    const text = getShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStatus(true);
      if (analytics && analytics.shareCopySuccess) {
        analytics.shareCopySuccess(score);
      }
      setTimeout(() => setCopiedStatus(false), 1800);
    } catch {
      if (analytics && analytics.shareFailed) {
        analytics.shareFailed(score);
      }
    }
  };

  return (
    <main className="h-[100dvh] overflow-x-hidden overflow-y-auto bg-background text-foreground scroll-smooth relative">
      {/* Film Grain Noise Overlay */}
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.012]" />

      <section className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+3rem)] pt-[calc(env(safe-area-inset-top)+2rem)]">
        {/* Header Readout */}
        <div className="flex items-center justify-between border-b border-border-dim/60 pb-4 font-mono text-label uppercase tracking-kicker text-muted/70">
          <span>{puzzleNumber ? `UNCANNY #${puzzleNumber}` : isFallbackSet ? '// RESULTS' : "// TODAY'S RESULTS"}</span>
          <span>{setDate}</span>
        </div>

        {/* Primary Score Readout */}
        <div className="mt-10 text-center score-reveal">
          <div className="font-mono text-label uppercase tracking-kicker text-muted/70 mb-3">
            {isFallbackSet ? 'SET COMPLETE' : 'DAY COMPLETE'}
          </div>
          <div className="text-display font-sans font-light">
            <span className="text-foreground">{score}</span>
            <span className="text-muted text-3xl">/5</span>
          </div>
          <p className="mt-3 text-sm leading-snug text-foreground/95 font-sans font-light">
            {resultReflection(score)}
          </p>
          <p className="mt-1.5 font-mono text-label-lg uppercase tracking-label text-muted">
            {copy.results.beat(comparison)}
          </p>
        </div>

        {/* Session metadata row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-y border-border-dim/60 py-3 font-mono text-label uppercase tracking-label text-muted/80">
          <span>ACCURACY {perceptionPercent}%</span>
          <span>TIME {completionLabel}</span>
          {streak > 0 && (
            <span className="flex items-center gap-2">
              {copy.intro.streak(streak)}
              <span className="flex items-center gap-1" aria-hidden="true">
                {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                  <span key={i} className="block h-1 w-1 bg-outline" />
                ))}
              </span>
            </span>
          )}
          {nextSetLabel && <span className="text-muted/60">{copy.results.nextSet(nextSetLabel)}</span>}
        </div>

        {/* Comparative Statement */}
        <p className="mt-6 text-xs leading-relaxed text-muted/95 font-sans font-light">
          Your results have been saved. {speedObs} {tagInsight ? `${tagInsight}.` : ''}
        </p>

        {/* Wordle-style Share Block — renders exactly what gets copied */}
        {!isFallbackSet && results.length > 0 && (
          <div className="mt-8 border border-border-dim bg-surface p-5 text-center font-mono">
            <div className="text-label-lg uppercase tracking-label text-foreground">{shareHeader}</div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xl leading-none" aria-label={copy.results.marks}>
              {results.map((result, index) => (
                <span
                  key={index}
                  className={
                    result.guess === 'timeout'
                      ? 'text-muted/50'
                      : result.correct
                        ? 'text-real'
                        : 'text-wrong'
                  }
                >
                  {result.guess === 'timeout' ? '⬚' : result.correct ? '▣' : '☒'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Challenger Comparison Card */}
        {challengerName && challengerScore !== null && (
          <div className="mt-8 border border-wrong/40 bg-wrong/5 p-5 font-sans">
            <div className="font-mono text-label uppercase tracking-label text-wrong mb-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-wrong animate-pulse" />
              // Challenge comparison
            </div>
            <div className="flex flex-col gap-1.5 text-xs font-light text-muted">
              <div>
                <span className="font-medium text-foreground">You:</span> {score}/5
              </div>
              <div>
                <span className="font-medium text-foreground">{challengerName}:</span> {challengerScore}/5
              </div>
              <p className="mt-3.5 text-xs text-foreground/95 font-sans leading-relaxed border-t border-border-dim/60 pt-2.5">
                {score > challengerScore
                  ? 'You beat this score.'
                  : score === challengerScore
                    ? 'You matched this score.'
                    : 'Try again and improve your score.'}
              </p>
            </div>
          </div>
        )}

        {/* Prominent Social Share & Challenge Module */}
        {!isFallbackSet && challenges.length === 5 && (
          <div className="mt-8 border border-border-dim bg-surface/40 p-5 font-sans">
            <div className="font-mono text-label uppercase tracking-label text-muted/75 mb-2.5">
              // {isChallengePlay ? 'Challenge Duel' : 'Social Standings'}
            </div>
            <h3 className="text-sm font-sans font-normal tracking-wide text-foreground leading-snug">
              Can your friends beat this?
            </h3>
            <p className="mt-1 text-label-lg leading-relaxed text-muted font-light">
              {isChallengePlay
                ? 'Challenge another friend or send back your score to your challenger.'
                : 'Share this set and challenge your friends to beat your score under the same timer.'}
            </p>
            <p className="mt-1.5 font-mono text-label uppercase tracking-label text-muted/60">
              Friends see your score only after they play.
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                id={isChallengePlay ? "send-back-btn" : "challenge-friend-btn"}
                type="button"
                onClick={handleShare}
                className="min-h-14 bg-primary text-background hover:bg-primary/90 active:bg-primary/90 active:scale-[0.985] py-3.5 px-4 text-center font-mono text-label-lg uppercase tracking-caps font-medium cursor-pointer transition-all duration-200"
              >
                {isChallengePlay ? 'Send Back' : copy.results.challenge}
              </button>
              <button
                id={isChallengePlay ? "challenge-another-friend-btn" : "copy-result-btn"}
                type="button"
                onClick={handleCopyOnly}
                className="min-h-14 border border-outline/60 hover:border-outline hover:bg-white/5 active:bg-white/5 active:scale-[0.985] text-muted hover:text-foreground active:text-foreground py-3.5 px-4 text-center font-mono text-label-lg uppercase tracking-caps font-medium cursor-pointer transition-all duration-200"
              >
                {copiedStatus ? 'Copied.' : isChallengePlay ? 'Challenge Another Friend' : 'Copy Result'}
              </button>
            </div>
          </div>
        )}

        {/* ── Interactive Photographic Grid Matrix ── */}
        <div className="mt-10">
          <div className="font-mono text-label uppercase tracking-label text-muted/75 mb-4">
            // Today's Set
          </div>
          <div className="grid grid-cols-5 gap-2.5 sm:gap-4">
            {results.map((result, index) => {
              const challenge = challenges.find(c => c.id === result.challengeId) || challenges[index];
              const isSelected = selectedIndex === index;
              
              const symbol = result.guess === 'timeout'
                ? '⬚'
                : result.correct
                  ? '▣'
                  : '☒';
              
              const statusColor = result.guess === 'timeout'
                ? 'text-muted/40'
                : result.correct
                  ? 'text-correct/90'
                  : 'text-wrong/95';

              const activeBorder = isSelected
                ? 'border-2 border-outline'
                : 'border border-border-dim/60 hover:border-outline/60 active:border-outline/60';

              return (
                <button
                  type="button"
                  key={`${result.challengeId}-${index}`}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative aspect-[4/5] w-full overflow-hidden bg-surface transition-all duration-300 cursor-pointer ${activeBorder}`}
                >
                  {challenge?.image_url && (
                    <Image
                      src={challenge.image_url}
                      alt={`Image preview 0${index + 1}`}
                      fill
                      className={`object-cover opacity-80 transition-all duration-300 pointer-events-none ${isSelected ? 'scale-105 opacity-100' : 'hover:opacity-95'}`}
                      sizes="(max-width: 768px) 20vw, 96px"
                    />
                  )}
                  {/* Bottom Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />

                  {/* Status Indicator Badge */}
                  <div className="absolute top-1.5 right-1.5 flex items-center justify-center bg-background/60 backdrop-blur-[2px] w-4.5 h-4.5 pointer-events-none">
                    <span className={`text-label font-mono leading-none ${statusColor}`}>
                      {symbol}
                    </span>
                  </div>

                  {/* Tag label */}
                  <div className="absolute bottom-1 inset-x-0 text-center pointer-events-none">
                    <span className="font-mono text-label tracking-label text-muted/90 font-light bg-background/45 px-1 py-0.5">
                      0{index + 1}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Dynamic Debrief & Results Panel ── */}
        {selectedResult && selectedImageUrl && (
          <div className="mt-6 border border-border-dim bg-surface/40 p-5 fade-in">
            <div className="grid gap-5 sm:grid-cols-[13rem_1fr] items-start">
              {/* Image Preview Block */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface sm:aspect-[4/3] border border-border-dim/60">
                <Image
                  src={selectedImageUrl}
                  alt="Results image preview"
                  fill
                  className="object-cover opacity-90 pointer-events-none"
                  draggable={false}
                  sizes="(max-width: 768px) 100vw, 208px"
                />
              </div>

              {/* Image feedback text content */}
              <div className="py-0.5 flex flex-col justify-between h-full">
                <div>
                  <div className="font-mono text-label uppercase tracking-label text-muted/75">
                    // Image 0{selectedIndex + 1}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted/95 font-sans font-light">
                    {getSelectionNarrative(selectedResult)}
                  </p>
                  {selectedResult?.context_short && (
                    <p className="mt-2 text-xs leading-relaxed text-foreground/95 font-sans font-light border-l border-border-dim pl-2.5 py-0.5">
                      {selectedResult.context_short}
                    </p>
                  )}
                </div>

                {/* Live Community Consensus Progress Bar */}
                {(() => {
                  const totalGuesses = (selectedResult?.guesses_ai || 0) + (selectedResult?.guesses_real || 0);
                  const aiPercent = totalGuesses > 0 ? Math.round((selectedResult?.guesses_ai || 0) / totalGuesses * 100) : 50;
                  const realPercent = 100 - aiPercent;
                  return (
                    <div className="mt-4 pt-3 border-t border-border-dim/60">
                      <div className="flex justify-between font-mono text-label tracking-label text-muted/80 mb-1.5 uppercase">
                        <span>AI: {aiPercent}%</span>
                        <span>Real: {realPercent}%</span>
                      </div>
                      <div className="w-full h-1 bg-border-dim/40 flex overflow-hidden">
                        <div className="h-full bg-wrong/75" style={{ width: `${aiPercent}%` }} />
                        <div className="h-full bg-real/75" style={{ width: `${realPercent}%` }} />
                      </div>
                      <div className="flex justify-between items-center mt-2 font-mono text-label text-muted/60 leading-none">
                        <span>Compare with players ({totalGuesses.toLocaleString()} guesses)</span>
                        {selectedResult?.unsplash_url && selectedResult?.photographer_name && (
                          <a
                            href={selectedResult.unsplash_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-foreground active:text-foreground transition-all uppercase tracking-label"
                          >
                            Credits: {selectedResult.photographer_name}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── Misleading Image block (Borderless and integrated) ── */}
        {misleadingChallenge && misleadingChallenge.id !== selectedChallenge.id && (
          <div className="mt-8 border-t border-border-dim/60 pt-6">
            <div className="font-mono text-label uppercase tracking-label text-muted/75 mb-3.5">
              // Most Fooled Image
            </div>
            <div className="grid gap-5 sm:grid-cols-[6rem_1fr] items-center">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface sm:aspect-[4/5] sm:w-24 border border-border-dim/60">
                <Image
                  src={misleadingChallenge.image_url}
                  alt="Most fooled image"
                  fill
                  className="object-cover opacity-80 pointer-events-none"
                  draggable={false}
                  sizes="(max-width: 768px) 100vw, 96px"
                />
              </div>
              <p className="min-w-0 text-xs leading-relaxed text-muted/90 font-sans font-light max-w-md">
                {copy.results.misleadingNote}
              </p>
            </div>
          </div>
        )}

        {/* ── Daily Set Leaderboard Module ── */}
        {!isFallbackSet && (
          <div className="mt-10 border border-border-dim bg-surface/40 p-5 font-sans">
            <div className="flex items-center justify-between border-b border-border-dim/60 pb-3.5 mb-4">
              <span className="font-mono text-label uppercase tracking-label text-muted/75">// Leaderboard for this set</span>
              <span className="font-mono text-label tracking-caps text-muted/60">For this set only.</span>
            </div>

            {loadingLeaderboard ? (
              <div className="py-8 text-center font-mono text-label uppercase tracking-label text-muted/40 animate-pulse">
                Loading standings...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-muted/80 font-light">Be the first on this set.</p>
              </div>
            ) : (
              <div className="w-full space-y-1.5">
                {/* Table Header */}
                <div className="grid grid-cols-12 py-1.5 px-3 font-mono text-label uppercase tracking-label text-muted/50 border-b border-border-dim/60 mb-1">
                  <div className="col-span-2">Rank</div>
                  <div className="col-span-5">Player</div>
                  <div className="col-span-2 text-right">Score</div>
                  <div className="col-span-3 text-right">Time</div>
                </div>
                
                {/* Top 20 attempts */}
                {leaderboard.slice(0, 20).map((attempt) => {
                  const isSelf = attempt.is_self;
                  return (
                    <div
                      key={attempt.id || attempt.display_name}
                      className={`grid grid-cols-12 py-2 px-3 text-xs font-light items-center ${
                        isSelf
                          ? 'bg-surface border border-outline/40 text-foreground'
                          : 'hover:bg-white/1 text-muted/95 border border-transparent'
                      }`}
                    >
                      <div className="col-span-2 font-mono text-label text-muted/60">
                        {String(attempt.rank).padStart(2, '0')}
                      </div>
                      <div className="col-span-5 truncate pr-2 font-sans tracking-wide">
                        {attempt.display_name} {isSelf && '(You)'}
                      </div>
                      <div className="col-span-2 text-right font-sans">{attempt.score}/5</div>
                      <div className="col-span-3 text-right font-mono text-label text-muted/80">
                        {formatTime(attempt.completion_ms)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* If the current player has a rank outside Top 20, show their row below */}
            {!loadingLeaderboard && playerRank && playerRank > 20 && playerAttempt && (
              <div className="mt-4 border-t border-dashed border-border-dim/60 pt-3">
                <div className="grid grid-cols-12 py-2.5 px-3 text-xs font-light bg-surface border border-outline/40 text-foreground items-center">
                  <div className="col-span-2 font-mono text-label text-muted/80">#{playerRank}</div>
                  <div className="col-span-5 truncate pr-2 font-sans tracking-wide">
                    {playerAttempt.display_name} (You)
                  </div>
                  <div className="col-span-2 text-right font-sans">{playerAttempt.score}/5</div>
                  <div className="col-span-3 text-right font-mono text-label">
                    {formatTime(playerAttempt.completion_ms)}
                  </div>
                </div>
                <p className="mt-2 text-label text-muted/60 text-right font-sans font-light">
                  You are #{playerRank} on this set.
                </p>
              </div>
            )}

            {/* Optional Display Name Input & Submission Form */}
            {!hasSubmittedScore && !loadingLeaderboard && (
              <div className="mt-6 border-t border-border-dim/60 pt-5">
                <div className="font-mono text-label uppercase tracking-label text-muted/75 mb-3">
                  // Save Instinct standings
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label htmlFor="leaderboard-name" className="block font-mono text-label uppercase tracking-label text-muted/50 mb-1.5">
                      Name for leaderboard
                    </label>
                    <input
                      id="leaderboard-name"
                      type="text"
                      maxLength={20}
                      placeholder={defaultDisplayName}
                      value={leaderboardName}
                      onChange={(e) => setLeaderboardName(e.target.value.slice(0, 20))}
                      className="w-full bg-surface/40 border border-border-dim hover:border-outline/60 focus:border-outline text-xs px-3.5 py-2.5 outline-none text-foreground font-sans placeholder-muted/30 transition-all font-light min-h-11"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={submittingScore}
                    onClick={handleSubmitScore}
                    className="w-full sm:w-auto min-h-11 bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/90 active:scale-[0.985] disabled:opacity-50 transition-all px-6 py-2.5 text-center font-mono text-label-lg uppercase tracking-caps font-medium cursor-pointer"
                  >
                    {submittingScore ? 'Adding...' : 'Add My Score'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Unified Neural Pathways & Sponsor Actions ── */}
        {!isChallengePlay && (
          <div className="mt-10 border border-border-dim bg-surface/40 p-5 font-mono">
            <div className="text-label font-medium uppercase tracking-label text-muted/75 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-outline animate-pulse" />
              // CONTINUE EXPLORING
            </div>
            <p className="text-label text-muted/75 leading-relaxed font-light mb-5">
              Explore another set of images. Supported by a sponsor message.
            </p>

            <div className="flex flex-col gap-3">
              {/* Option A: Request Reflection / Deeper Anomaly Play */}
              {!adAlreadyUnlocked && onRequestReflection && reflectionLevel < 3 && (
                <button
                  type="button"
                  disabled={cooldownRemaining > 0}
                  onClick={onRequestReflection}
                  className={`w-full text-left p-4 border transition-all duration-300 ${
                    cooldownRemaining > 0
                      ? 'border-border-dim/60 bg-transparent opacity-65 cursor-not-allowed'
                      : 'border-outline/40 hover:border-outline bg-surface/40 hover:bg-surface/70 active:border-outline active:bg-surface/70 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between text-label-lg tracking-label font-medium text-foreground uppercase">
                    <span>
                      {reflectionLevel === 1
                        ? '01. Continue Exploring (Level 2)'
                        : reflectionLevel === 2
                          ? '01. Continue Exploring (Level 3)'
                          : '01. Continue Exploring (Level 1)'}
                    </span>
                    {cooldownRemaining > 0 && (
                      <span className="text-label lowercase text-muted/60 tracking-normal normal-case">
                        Preparing next set...
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-label leading-normal text-muted/80 font-sans font-light normal-case">
                    {cooldownRemaining > 0
                      ? `Preparing next set of images (${cooldownRemaining}s remaining).`
                      : reflectionLevel === 1
                        ? 'Unlock Level 2. 2 extra images remain. A short sponsor-supported video will play.'
                        : reflectionLevel === 2
                          ? 'Unlock Level 3. Final image. A short sponsor-supported video will play.'
                          : 'Unlock Level 1. 3 extra images available. A short sponsor-supported video will play.'}
                  </p>
                </button>
              )}

              {/* Option B: Watch & Play Again */}
              {onUnlockExtraPlay && !adWatched && (
                <button
                  type="button"
                  disabled={adPlaying}
                  onClick={handleWatchAndReplay}
                  className="w-full text-left p-4 border border-outline/40 hover:border-outline bg-surface/40 hover:bg-surface/70 active:border-outline active:bg-surface/70 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-label-lg tracking-label font-medium text-foreground uppercase">
                    {adPlaying ? '02. Preparing Replay...' : "02. Replay Today's Set"}
                  </div>
                  <p className="mt-2 text-label leading-normal text-muted/80 font-sans font-light normal-case">
                    Replay today's set of 5 images to test your instinct again.
                  </p>
                </button>
              )}
            </div>
          </div>
        )}

        {showOverlay && <CalmAdTransitionOverlay state={overlayPhase} />}

        {/* ── Main Action Buttons Area ── */}
        <div className="grid gap-3.5 mt-8 border-t border-border-dim/60 pt-8 pb-4">
          {!isFallbackSet && challenges.length === 5 && (
            <button
              id="share-btn"
              type="button"
              onClick={handleShare}
              className="w-full min-h-14 bg-primary text-background hover:bg-primary/95 active:bg-primary/90 transition-all py-3.5 text-center font-mono text-label-lg uppercase tracking-caps font-medium active:scale-[0.985] cursor-pointer"
            >
              {isChallengePlay ? 'Send Back' : copy.results.share}
            </button>
          )}

          <div className={`grid gap-3 ${isFallbackSet ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <a
              href="/profile"
              className="min-w-0 min-h-14 flex items-center justify-center border border-outline/60 py-3.5 text-center font-mono text-label-lg uppercase tracking-caps text-muted/90 hover:text-foreground hover:bg-white/5 active:text-foreground active:bg-white/5 transition-all"
            >
              Profile
            </a>
            {!isFallbackSet && (
              <a
                href="/leaderboard"
                className="min-w-0 min-h-14 flex items-center justify-center border border-outline/60 py-3.5 text-center font-mono text-label-lg uppercase tracking-caps text-muted/90 hover:text-foreground hover:bg-white/5 active:text-foreground active:bg-white/5 transition-all"
              >
                Compare with players
              </a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
