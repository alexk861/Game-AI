'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import GameShell from '@/components/GameShell';
import RevealScreen from '@/components/RevealScreen';
import ResultsDebrief from '@/components/ResultsDebrief';
import ArchiveExhausted from '@/components/ArchiveExhausted';
import { copy, socialTensionFor } from '@/lib/copy';
import { analytics } from '@/lib/analytics';
import {
  initTodaySession,
  markTodayStarted,
  addResult,
  updateLatestReasoningTag,
  completeSet,
  hasCompletedToday,
  hasStartedToday,
  getResumeIndex,
} from '@/lib/storage';
import type { Challenge, GuessResult, GamePhase, RevealData, UncannyStorage } from '@/lib/types';
import { TIMER_DURATION_SECONDS, TOTAL_DAILY_CHALLENGES } from '@/lib/gameConfig';

const TIMER_DURATION = TIMER_DURATION_SECONDS;
const REVEAL_DURATION = 5200;
const TOTAL_CHALLENGES = TOTAL_DAILY_CHALLENGES;

function socialHintFor(challenge: Challenge, index: number): string {
  return socialTensionFor(challenge.id, index);
}

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<GuessResult[]>([]);
  const [showReasoningTags, setShowReasoningTags] = useState(false);
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [setDate, setSetDate] = useState('');
  const [streak, setStreak] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [completionMs, setCompletionMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const challengeStartedAtRef = useRef(0);

  const loadDailySet = useCallback(async (state: UncannyStorage, completed: boolean) => {
    try {
      const res = await fetch('/api/daily-set');
      if (!res.ok) {
        if (completed) {
          setPhase('completed');
          return;
        }

        setError(res.status === 404
          ? copy.errors.archiveUnavailable
          : copy.errors.signalInterrupted
        );
        setPhase('error');
        return;
      }

      const data = await res.json();
      setChallenges(data.challenges);
      setSetDate(data.date);

      if (completed) {
        setResults(state.todayResults);
        setStreak(state.currentStreak);
        setSessionStartedAt(state.todayStartedAt);
        setCompletionMs(state.todayCompletionMs);
        setElapsedMs(state.todayCompletionMs ?? 0);
        analytics.returningUser(state.currentStreak, state.totalSetsPlayed);
        setPhase('exhausted');
        return;
      }

      const resumeIdx = getResumeIndex();
      const playableTotal = Math.min(TOTAL_CHALLENGES, data.challenges.length);
      if (resumeIdx >= playableTotal) {
        const finalState = completeSet();
        setResults(finalState.todayResults);
        setStreak(finalState.currentStreak);
        setSessionStartedAt(finalState.todayStartedAt);
        setCompletionMs(finalState.todayCompletionMs);
        setElapsedMs(finalState.todayCompletionMs ?? 0);
        analytics.returningUser(finalState.currentStreak, finalState.totalSetsPlayed);
        setPhase('completed');
        return;
      }

      const timingState = state.todayStartedAt === null ? markTodayStarted() : state;
      setSessionStartedAt(timingState.todayStartedAt);
      setElapsedMs(timingState.todayStartedAt === null ? 0 : Date.now() - timingState.todayStartedAt);

      if (resumeIdx > 0) {
        setResults(timingState.todayResults);
        setCurrentIndex(resumeIdx);
      }

      analytics.sessionStarted(data.date);
      challengeStartedAtRef.current = Date.now();
      setPhase('playing');
      setTimerRunning(true);

      const challenge = data.challenges[resumeIdx] || data.challenges[0];
      if (challenge) {
        analytics.challengeStarted(challenge.id, challenge.set_order, challenge.difficulty);
      }
    } catch {
      setError(copy.errors.networkUnstable);
      setPhase(completed ? 'completed' : 'error');
    }
  }, []);

  useEffect(() => {
    if (sessionStartedAt === null || (phase !== 'playing' && phase !== 'investigating' && phase !== 'revealing')) {
      return;
    }

    const intervalId = setInterval(() => {
      setElapsedMs(Date.now() - sessionStartedAt);
    }, 500);

    return () => clearInterval(intervalId);
  }, [phase, sessionStartedAt]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const initId = setTimeout(() => {
      const state = initTodaySession();

      if (hasCompletedToday()) {
        void loadDailySet(state, true);
        return;
      }

      if (!hasStartedToday()) {
        setPhase('entry');
        return;
      }

      void loadDailySet(state, false);
    }, 0);

    return () => clearTimeout(initId);
  }, [loadDailySet]);

  const handleBegin = useCallback(() => {
    const state = markTodayStarted();
    setSessionStartedAt(state.todayStartedAt);
    setElapsedMs(0);
    setCompletionMs(null);
    setPhase('loading');
    void loadDailySet(state, false);
  }, [loadDailySet]);

  const advanceToNext = useCallback((currentResults: GuessResult[]) => {
    const nextIndex = currentResults.length;

    if (nextIndex >= TOTAL_CHALLENGES || nextIndex >= challenges.length) {
      const finalState = completeSet();
      setStreak(finalState.currentStreak);
      setCompletionMs(finalState.todayCompletionMs);
      setElapsedMs(finalState.todayCompletionMs ?? elapsedMs);
      const score = currentResults.filter(result => result.correct).length;
      analytics.setCompleted(score, finalState.currentStreak, setDate);
      setPhase('completed');
    } else {
      setCurrentIndex(nextIndex);
      setRevealData(null);
      setShowReasoningTags(false);
      setTimerKey(previous => previous + 1);
      challengeStartedAtRef.current = Date.now();
      setPhase('playing');
      setTimerRunning(true);

      const nextChallenge = challenges[nextIndex];
      if (nextChallenge) {
        analytics.challengeStarted(nextChallenge.id, nextChallenge.set_order, nextChallenge.difficulty);
      }
    }
  }, [challenges, elapsedMs, setDate]);

  const submitGuess = useCallback(async (guess: 'ai' | 'real' | 'timeout') => {
    if (phase !== 'playing' && phase !== 'investigating') return;
    if (submittingRef.current) return;

    submittingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const challenge = challenges[currentIndex];
    if (!challenge) {
      if (abortControllerRef.current === abortController) {
        submittingRef.current = false;
      }
      return;
    }

    setTimerRunning(false);
    const elapsedSeconds = Math.max(0, (Date.now() - challengeStartedAtRef.current) / 1000);
    const timeRemaining = guess === 'timeout'
      ? 0
      : Math.max(0, Math.min(TIMER_DURATION, TIMER_DURATION - elapsedSeconds));

    if (navigator.vibrate) navigator.vibrate(30);

    if (guess === 'timeout') {
      analytics.timerExpired(challenge.id, challenge.set_order);
    }

    try {
      const effectiveGuess = guess === 'timeout' ? 'ai' : guess;
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id, guess: effectiveGuess }),
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error('Failed to submit guess');

      const data = await res.json();
      const guessResult: GuessResult = {
        challengeId: challenge.id,
        guess,
        correct: guess === 'timeout' ? false : data.correct,
        timeRemaining,
        answer: data.answer,
        imageUrl: challenge.image_url,
      };

      const reveal: RevealData = {
        correct: guessResult.correct,
        answer: data.answer,
        context_short: data.context_short,
        ai_prompt: data.ai_prompt,
        source_credit: data.source_credit,
        photographer_name: data.photographer_name,
        photographer_url: data.photographer_url,
        unsplash_url: data.unsplash_url,
        guesses_ai: data.guesses_ai,
        guesses_real: data.guesses_real,
      };

      if (guess !== 'timeout') {
        analytics.guessSubmitted(challenge.id, guess, data.correct, timeRemaining);
      }
      if (guessResult.correct) {
        analytics.resultCorrect(challenge.id, challenge.set_order, challenge.difficulty);
      } else {
        analytics.resultWrong(challenge.id, challenge.set_order, challenge.difficulty);
      }
      analytics.challengeRevealed(challenge.id, guessResult.correct);

      const updatedResults = [...results, guessResult];
      setResults(updatedResults);
      addResult(guessResult);
      if (updatedResults.length >= TOTAL_CHALLENGES || updatedResults.length >= challenges.length) {
        const finalState = completeSet(Date.now());
        setStreak(finalState.currentStreak);
        setCompletionMs(finalState.todayCompletionMs);
        setElapsedMs(finalState.todayCompletionMs ?? 0);
      }
      setShowReasoningTags(true);
      setTimeout(() => {
        setShowReasoningTags(false);
        setRevealData(reveal);
        setPhase('revealing');
        setTimeout(() => advanceToNext(updatedResults), REVEAL_DURATION);
      }, 2200);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const guessResult: GuessResult = {
        challengeId: challenge.id,
        guess,
        correct: false,
        timeRemaining,
        answer: 'ai',
        imageUrl: challenge.image_url,
      };
      const reveal: RevealData = {
        correct: false,
        answer: 'ai',
        context_short: copy.reveal.networkFallback,
        ai_prompt: null,
        source_credit: null,
        photographer_name: null,
        photographer_url: null,
        unsplash_url: null,
        guesses_ai: 0,
        guesses_real: 0,
      };

      analytics.resultWrong(challenge.id, challenge.set_order, challenge.difficulty);
      analytics.challengeRevealed(challenge.id, false);

      const updatedResults = [...results, guessResult];
      setResults(updatedResults);
      addResult(guessResult);
      if (updatedResults.length >= TOTAL_CHALLENGES || updatedResults.length >= challenges.length) {
        const finalState = completeSet(Date.now());
        setStreak(finalState.currentStreak);
        setCompletionMs(finalState.todayCompletionMs);
        setElapsedMs(finalState.todayCompletionMs ?? 0);
      }
      setShowReasoningTags(true);
      setTimeout(() => {
        setShowReasoningTags(false);
        setRevealData(reveal);
        setPhase('revealing');
        setTimeout(() => advanceToNext(updatedResults), REVEAL_DURATION);
      }, 2200);
    } finally {
      if (abortControllerRef.current === abortController) {
        submittingRef.current = false;
        abortControllerRef.current = null;
      }
    }
  }, [phase, challenges, currentIndex, results, advanceToNext]);

  const handleTimerExpire = useCallback(() => {
    if (phase === 'playing' || phase === 'investigating') {
      void submitGuess('timeout');
    }
  }, [phase, submitGuess]);

  const handleInvestigatingChange = useCallback((investigating: boolean) => {
    setPhase(current => {
      if (investigating && current === 'playing') return 'investigating';
      if (!investigating && current === 'investigating') return 'playing';
      return current;
    });
  }, []);

  const handleTagSelected = useCallback((tag: string) => {
    setResults(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], reasoningTag: tag };
      return updated;
    });
    updateLatestReasoningTag(tag);
  }, []);

  if (phase === 'entry') {
    return <WelcomeScreen onBegin={handleBegin} />;
  }

  if (phase === 'loading') {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center bg-background cinematic-bg">
        <div className="noise-overlay" />
        <div className="relative z-10 font-mono text-[10px] uppercase tracking-[0.3em] text-muted/60">
          {copy.gameplay.loading}
        </div>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center bg-background cinematic-bg px-8">
        <div className="noise-overlay" />
        <div className="relative z-10 font-mono text-[10px] uppercase tracking-[0.3em] text-muted/60">
          {copy.errors.sourceUnresolved}
        </div>
        <div className="relative z-10 mt-5 max-w-xs text-center text-sm leading-relaxed text-muted">{error}</div>
      </main>
    );
  }

  if (phase === 'completed') {
    return (
      <ResultsDebrief
        results={results}
        challenges={challenges}
        streak={streak}
        setDate={setDate}
        completionMs={completionMs}
      />
    );
  }

  if (phase === 'exhausted') {
    return <ArchiveExhausted />;
  }

  const currentChallenge = challenges[currentIndex];

  if (!currentChallenge) {
    return (
      <main className="flex h-[100dvh] items-center justify-center bg-background cinematic-bg">
        <div className="font-mono text-sm text-muted">{copy.gameplay.missing}</div>
      </main>
    );
  }

  if (phase === 'revealing' && revealData) {
    return (
      <RevealScreen
        imageUrl={currentChallenge.image_url}
        data={revealData}
        result={results[results.length - 1] || null}
      />
    );
  }

  return (
    <GameShell
      challenge={currentChallenge}
      nextImageUrl={challenges[currentIndex + 1]?.image_url}
      phase={phase}
      timerKey={timerKey}
      timerDuration={TIMER_DURATION}
      timerRunning={timerRunning}
      elapsedMs={elapsedMs}
      currentIndex={currentIndex}
      total={TOTAL_CHALLENGES}
      results={results}
      socialHint={socialHintFor(currentChallenge, currentIndex)}
      showReasoningTags={showReasoningTags}
      onTimerExpire={handleTimerExpire}
      onDecision={submitGuess}
      onInvestigatingChange={handleInvestigatingChange}
      onTagSelected={handleTagSelected}
    />
  );
}
