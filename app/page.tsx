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
  completeSet,
  hasCompletedToday,
  hasStartedToday,
  getResumeIndex,
} from '@/lib/storage';
import type { Challenge, GuessResult, GamePhase, RevealData, UncannyStorage } from '@/lib/types';

const TIMER_DURATION = 12;
const REVEAL_DURATION = 5200;
const TOTAL_CHALLENGES = 5;

function socialHintFor(challenge: Challenge, index: number): string {
  return socialTensionFor(challenge.id, index);
}

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<GuessResult[]>([]);
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
      setTimerKey(previous => previous + 1);
      setPhase('playing');
      setTimerRunning(true);

      const nextChallenge = challenges[nextIndex];
      if (nextChallenge) {
        analytics.challengeStarted(nextChallenge.id, nextChallenge.set_order, nextChallenge.difficulty);
      }
    }
  }, [challenges, elapsedMs, setDate]);

  const submitGuess = useCallback(async (guess: 'ai' | 'real' | 'timeout') => {
    if (submittingRef.current || (phase !== 'playing' && phase !== 'investigating')) return;
    submittingRef.current = true;

    const challenge = challenges[currentIndex];
    if (!challenge) {
      submittingRef.current = false;
      return;
    }

    setTimerRunning(false);

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
      });

      if (!res.ok) throw new Error('Failed to submit guess');

      const data = await res.json();
      const guessResult: GuessResult = {
        challengeId: challenge.id,
        guess,
        correct: guess === 'timeout' ? false : data.correct,
        timeRemaining: guess === 'timeout' ? 0 : TIMER_DURATION,
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
        analytics.guessSubmitted(challenge.id, guess, data.correct, TIMER_DURATION);
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
      setTimeout(() => {
        setRevealData(reveal);
        setPhase('revealing');
        setTimeout(() => advanceToNext(updatedResults), REVEAL_DURATION);
      }, 250);
    } catch {
      const guessResult: GuessResult = {
        challengeId: challenge.id,
        guess,
        correct: false,
        timeRemaining: 0,
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
      setTimeout(() => {
        setRevealData(reveal);
        setPhase('revealing');
        setTimeout(() => advanceToNext(updatedResults), REVEAL_DURATION);
      }, 250);
    } finally {
      submittingRef.current = false;
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
      onTimerExpire={handleTimerExpire}
      onDecision={submitGuess}
      onInvestigatingChange={handleInvestigatingChange}
    />
  );
}
