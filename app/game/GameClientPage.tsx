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
  bootstrapStorage,
  initTodaySession,
  getStorage,
  saveStorage,
  markTodayStarted,
  addResult,
  updateLatestReasoningTag,
  completeSet,
  hasCompletedToday,
  hasStartedToday,
  getResumeIndex,
  resetTodaySessionForAdExtraPlay,
  unlockRewardedReflection,
  addReflectionResult,
  completeReflection,
  markChallengeSeen,
} from '@/lib/storage';
import type { Challenge, GuessResult, GamePhase, RevealData, UncannyStorage } from '@/lib/types';
import { TIMER_DURATION_SECONDS, TOTAL_DAILY_CHALLENGES, getApiUrl } from '@/lib/gameConfig';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import CalmAdTransitionOverlay from '@/components/CalmAdTransitionOverlay';
import Link from 'next/link';

const TIMER_DURATION = TIMER_DURATION_SECONDS;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateString: string): boolean {
  if (!dateRegex.test(dateString)) return false;
  
  const timestamp = Date.parse(dateString);
  if (isNaN(timestamp)) return false;
  
  const dateParts = dateString.split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
  const day = parseInt(dateParts[2], 10);
  
  const d = new Date(year, month, day);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

function socialHintFor(challenge: Challenge, index: number): string {
  return socialTensionFor(challenge.id, index);
}

export default function Home({ challengeDate }: { challengeDate?: string } = {}) {
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
  const [isFallbackSet, setIsFallbackSet] = useState(false);
  const submittingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const challengeStartedAtRef = useRef(0);

  // Premium Rewarded Reflection States
  const [adOverlayState, setAdOverlayState] = useState<'none' | 'decompressing' | 'reentering'>('none');
  const [isReflectionPlay, setIsReflectionPlay] = useState(false);
  const [activeAdLevel, setActiveAdLevel] = useState<number>(0);
  const [reflectionLevel, setReflectionLevel] = useState<number>(0);
  const [lastReflectionUnlockAt, setLastReflectionUnlockAt] = useState<string | null>(null);
  const adRewardEarnedRef = useRef(false);

  // Challenge Play States
  const [isChallengePlay, setIsChallengePlay] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Transition Countdown States
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const countdownCallback = null;
  const countdownLabel = '';
  const countdownSublabel = '';

  const loadDailySet = useCallback(async (state: UncannyStorage, completed: boolean) => {
    try {
      const activeReflection = !!(state.rewardedReflectionUsedToday && !state.rewardedReflectionCompleted);
      setIsReflectionPlay(activeReflection);
      const currentLevel = state.reflectionLevel ?? 0;

      let fetchedChallenges: Challenge[] = [];
      let fetchedDate = '';
      let fetchedIsFallback = false;

      if (activeReflection) {
        const expectedCount = currentLevel === 3 ? 1 : currentLevel === 2 ? 2 : 3;
        
        // Check if we already have persisted active extra challenges for this level
        if (state.activeExtraChallenges && state.activeExtraChallenges.length === expectedCount) {
          const expectedOrders = currentLevel === 1 ? [6, 7, 8] : currentLevel === 2 ? [9, 10] : [11];
          const matches = state.activeExtraChallenges.every((c, idx) => c.set_order === expectedOrders[idx]);
          if (matches) {
            fetchedChallenges = state.activeExtraChallenges;
            fetchedDate = state.todayDate || new Date().toISOString().split('T')[0];
            fetchedIsFallback = false;
          }
        }

        if (fetchedChallenges.length === 0) {
          const res = await fetch(getApiUrl('/api/extra-set'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              level: currentLevel,
              seed: state.reflectionSeed || `extra-${currentLevel}-${Date.now()}`,
              seenHistory: state.seenLog || [],
            }),
          });

          if (!res.ok) {
            if (completed) {
              setPhase('completed');
              return;
            }
            setError(copy.errors.signalInterrupted);
            setPhase('error');
            return;
          }

          const data = await res.json();
          fetchedChallenges = data.challenges;
          fetchedDate = data.date;
          fetchedIsFallback = data.isFallbackSet || false;

          // Save active extra challenges to local storage for persistence
          const updatedState = getStorage();
          updatedState.activeExtraChallenges = data.challenges;
          saveStorage(updatedState);
        }
      } else {
        // Fetch universal daily set seedless
        const res = await fetch(getApiUrl('/api/daily-set'));
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
        fetchedChallenges = data.challenges;
        fetchedDate = data.date;
        fetchedIsFallback = data.isFallbackSet || false;
      }

      setChallenges(fetchedChallenges);
      setSetDate(fetchedDate);
      setIsFallbackSet(fetchedIsFallback);

      if (completed) {
        if (activeReflection) {
          setResults(state.rewardedReflectionResults || []);
        } else {
          setResults(state.todayResults);
        }
        setStreak(state.currentStreak);
        setSessionStartedAt(state.todayStartedAt);
        setCompletionMs(state.todayCompletionMs);
        setElapsedMs(state.todayCompletionMs ?? 0);
        analytics.returningUser(state.currentStreak, state.totalSetsPlayed);
        setPhase('exhausted');
        return;
      }

      const resumeIdx = activeReflection ? (state.rewardedReflectionResults || []).length : getResumeIndex();
      const currentTotal = activeReflection
        ? currentLevel === 3
          ? 1
          : currentLevel === 2
            ? 2
            : 3
        : TOTAL_DAILY_CHALLENGES;
      const playableTotal = Math.min(currentTotal, fetchedChallenges.length);

      if (resumeIdx >= playableTotal) {
        if (activeReflection) {
          const finalState = completeReflection(state.rewardedReflectionCompletionMs ?? 0);
          setReflectionLevel(finalState.reflectionLevel ?? 0);
          setLastReflectionUnlockAt(finalState.lastReflectionUnlockAt ?? null);
          setResults(finalState.rewardedReflectionResults || []);
          setPhase('exhausted');
        } else {
          const finalState = completeSet();
          setResults(finalState.todayResults);
          setStreak(finalState.currentStreak);
          setSessionStartedAt(finalState.todayStartedAt);
          setCompletionMs(finalState.todayCompletionMs);
          setElapsedMs(finalState.todayCompletionMs ?? 0);
          analytics.returningUser(finalState.currentStreak, finalState.totalSetsPlayed);
          setPhase('completed');
        }
        return;
      }

      if (activeReflection) {
        setResults(state.rewardedReflectionResults || []);
        setCurrentIndex(resumeIdx);
        const startTime = state.rewardedReflectionUnlockedAt
          ? new Date(state.rewardedReflectionUnlockedAt).getTime()
          : Date.now();
        setSessionStartedAt(startTime);
        setElapsedMs(Date.now() - startTime);
      } else {
        const timingState = state.todayStartedAt === null ? markTodayStarted() : state;
        setSessionStartedAt(timingState.todayStartedAt);
        setElapsedMs(timingState.todayStartedAt === null ? 0 : Date.now() - timingState.todayStartedAt);

        if (resumeIdx > 0) {
          setResults(timingState.todayResults);
          setCurrentIndex(resumeIdx);
        }
      }

      analytics.sessionStarted(fetchedDate);
      challengeStartedAtRef.current = Date.now();
      setPhase('playing');
      setTimerRunning(true);

      const challenge = fetchedChallenges[resumeIdx] || fetchedChallenges[0];
      if (challenge) {
        analytics.challengeStarted(challenge.id, challenge.set_order, challenge.difficulty);
      }
    } catch {
      setError(copy.errors.networkUnstable);
      setPhase(completed ? 'completed' : 'error');
    }
  }, []);

  const loadChallengeSet = useCallback(async (setQuery: string) => {
    try {
      setPhase('loading');
      if (!isValidDate(setQuery)) {
        setError('invalid-date');
        setPhase('error');
        return;
      }
      const res = await fetch(getApiUrl(`/api/daily-set?set=${encodeURIComponent(setQuery)}`));
      if (!res.ok) {
        setError(copy.errors.archiveUnavailable);
        setPhase('error');
        return;
      }

      const data = await res.json();
      setChallenges(data.challenges);
      setSetDate(data.date);
      setIsFallbackSet(data.isFallbackSet || false);
      setResults([]);
      
      // Always show welcome/entry screen for challenge play so they can see entry copy
      setPhase('entry');
    } catch {
      setError(copy.errors.networkUnstable);
      setPhase('error');
    }
  }, []);

  const handleUnlockReflection = useCallback(() => {
    const state = unlockRewardedReflection();
    const newLevel = state.reflectionLevel ?? 1;
    setReflectionLevel(newLevel);
    setLastReflectionUnlockAt(state.lastReflectionUnlockAt ?? null);

    // Log reflection_level_started event
    analytics.reflectionLevelStarted(newLevel);

    setIsReflectionPlay(true);
    setCurrentIndex(0);
    setResults([]);
    setRevealData(null);
    setTimerRunning(false);
    setCompletionMs(null);
    setElapsedMs(0);
    void loadDailySet(state, false);
  }, [loadDailySet]);

  const handleAdClosed = useCallback(() => {
    setAdOverlayState('none');
    if (!adRewardEarnedRef.current) {
      const nextLevel = activeAdLevel || (getStorage().reflectionLevel ?? 0) + 1;
      
      // Log reflection_ad_dismissed and reflection_dropout
      analytics.reflectionAdDismissed(nextLevel);
      analytics.reflectionDropout(nextLevel);
    }
  }, [activeAdLevel]);

  const handleRewardEarned = useCallback(() => {
    adRewardEarnedRef.current = true;
    const nextLevel = activeAdLevel || (getStorage().reflectionLevel ?? 0) + 1;
    
    // Log reflection_ad_completed event
    analytics.reflectionAdCompleted(nextLevel);

    setAdOverlayState('reentering');
    setTimeout(() => {
      handleUnlockReflection();
      setAdOverlayState('none');
    }, 2500);
  }, [handleUnlockReflection, activeAdLevel]);

  const { triggerAd } = useRewardedAd(handleRewardEarned, handleAdClosed);

  const handleRequestAd = useCallback(() => {
    const state = getStorage();
    const currentLevel = state.reflectionLevel ?? 0;
    const nextLevel = Math.min(3, currentLevel + 1);

    // Log reflection_request event
    analytics.reflectionRequest(nextLevel);

    setActiveAdLevel(nextLevel);
    adRewardEarnedRef.current = false;

    setAdOverlayState('decompressing');
    setTimeout(() => {
      // Log reflection_ad_started event
      analytics.reflectionAdStarted(nextLevel);
      triggerAd();
    }, 2500);
  }, [triggerAd]);

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
    const currentChallenge = challenges[currentIndex];
    if (currentChallenge && (phase === 'playing' || phase === 'investigating')) {
      markChallengeSeen(currentChallenge);
    }
  }, [challenges, currentIndex, phase]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    async function init() {
      // Warm up secure Capacitor storage bridge
      await bootstrapStorage();

      const params = new URLSearchParams(window.location.search);
      const setQuery = challengeDate || params.get('set');

      if (setQuery) {
        setIsChallengePlay(true);
        if (analytics && (analytics as any).challengeCleanLinkOpened) {
          (analytics as any).challengeCleanLinkOpened(setQuery);
        }
        void loadChallengeSet(setQuery);
        return;
      }

      // Initialize session using the fully warmed state
      const initializedState = initTodaySession();
      setReflectionLevel(initializedState.reflectionLevel ?? 0);
      setLastReflectionUnlockAt(initializedState.lastReflectionUnlockAt ?? null);

      if (hasCompletedToday()) {
        void loadDailySet(initializedState, true);
        return;
      }

      if (!hasStartedToday()) {
        // Show the daily intro; handleBegin marks today started and loads the set
        setStreak(initializedState.currentStreak);
        setPhase('entry');
        return;
      }

      void loadDailySet(initializedState, false);
    }
    
    void init();
  }, [loadDailySet, loadChallengeSet]);

  const handleBegin = useCallback(() => {
    const startSession = () => {
      if (isChallengePlay) {
        setSessionStartedAt(Date.now());
        setElapsedMs(0);
        setCompletionMs(null);
        setCurrentIndex(0);
        setResults([]);
        setTimerKey(prev => prev + 1);
        challengeStartedAtRef.current = Date.now();
        setPhase('playing');
        setTimerRunning(true);
        return;
      }

      const state = markTodayStarted();
      setSessionStartedAt(state.todayStartedAt);
      setElapsedMs(0);
      setCompletionMs(null);
      setPhase('loading');
      void loadDailySet(state, false);
    };

    startSession();
  }, [isChallengePlay, loadDailySet]);

  const handleUnlockExtraPlay = useCallback(() => {
    const state = resetTodaySessionForAdExtraPlay();
    setReflectionLevel(state.reflectionLevel ?? 0);
    setLastReflectionUnlockAt(state.lastReflectionUnlockAt ?? null);
    setCurrentIndex(0);
    setResults([]);
    setRevealData(null);
    setTimerRunning(false);
    setCompletionMs(null);
    setElapsedMs(0);
    
    // Bypass welcome screen: Load and restart replay sequence immediately
    setSessionStartedAt(state.todayStartedAt ?? Date.now());
    setPhase('loading');
    void loadDailySet(state, false);
  }, [loadDailySet]);

  const advanceToNext = useCallback((currentResults: GuessResult[]) => {
    const nextIndex = currentResults.length;
    const currentLevel = getStorage().reflectionLevel ?? 1;
    const currentTotal = isReflectionPlay
      ? currentLevel === 3
        ? 1
        : currentLevel === 2
          ? 2
          : 3
      : TOTAL_DAILY_CHALLENGES;

    if (nextIndex >= currentTotal || nextIndex >= challenges.length) {
      if (isReflectionPlay) {
        // Log reflection_level_completed event
        analytics.reflectionLevelCompleted(currentLevel);

        // If it was Level 3 (Final Anomaly), log anomaly_completion event
        if (currentLevel === 3) {
          analytics.anomalyCompletion();
        }

        setPhase('exhausted');
      } else if (isChallengePlay) {
        const finalMs = sessionStartedAt ? Date.now() - sessionStartedAt : 0;
        setCompletionMs(finalMs);
        setElapsedMs(finalMs);
        const score = currentResults.filter(result => result.correct).length;
        if (analytics && (analytics as any).challengeCompleted) {
          (analytics as any).challengeCompleted(score, finalMs, setDate);
        } else {
          analytics.setCompleted(score, 0, setDate);
        }
        setPhase('completed');
      } else {
        const finalState = completeSet();
        setStreak(finalState.currentStreak);
        setCompletionMs(finalState.todayCompletionMs);
        setElapsedMs(finalState.todayCompletionMs ?? elapsedMs);
        const score = currentResults.filter(result => result.correct).length;
        analytics.setCompleted(score, finalState.currentStreak, setDate);
        setPhase('completed');
      }
    } else {
      const startNextChallenge = () => {
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
      };

      startNextChallenge();
    }
  }, [challenges, elapsedMs, setDate, isReflectionPlay, isChallengePlay, sessionStartedAt]);

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
      const res = await fetch(getApiUrl('/api/guess'), {
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
        guesses_ai: data.guesses_ai,
        guesses_real: data.guesses_real,
        unsplash_url: data.unsplash_url,
        photographer_name: data.photographer_name,
        context_short: data.context_short,
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

      let updatedResults: GuessResult[];
      if (isReflectionPlay) {
        const finalState = addReflectionResult(guessResult);
        updatedResults = finalState.rewardedReflectionResults || [];
        setResults(updatedResults);
        const currentLevel = finalState.reflectionLevel ?? 1;
        const currentTotal = currentLevel === 3 ? 1 : currentLevel === 2 ? 2 : 3;
        if (updatedResults.length >= currentTotal) {
          const finalDuration = sessionStartedAt ? Date.now() - sessionStartedAt : 0;
          const finishedState = completeReflection(finalDuration);
          setReflectionLevel(finishedState.reflectionLevel ?? 0);
          setLastReflectionUnlockAt(finishedState.lastReflectionUnlockAt ?? null);
        }
      } else if (isChallengePlay) {
        updatedResults = [...results, guessResult];
        setResults(updatedResults);
        const currentTotal = TOTAL_DAILY_CHALLENGES;
        if (updatedResults.length >= currentTotal || updatedResults.length >= challenges.length) {
          setCompletionMs(sessionStartedAt ? Date.now() - sessionStartedAt : 0);
          setElapsedMs(sessionStartedAt ? Date.now() - sessionStartedAt : 0);
        }
      } else {
        const finalState = addResult(guessResult);
        updatedResults = finalState.todayResults;
        setResults(updatedResults);
        const currentTotal = TOTAL_DAILY_CHALLENGES;
        if (updatedResults.length >= currentTotal || updatedResults.length >= challenges.length) {
          const finalStateCompleted = completeSet(Date.now());
          setStreak(finalStateCompleted.currentStreak);
          setCompletionMs(finalStateCompleted.todayCompletionMs);
          setElapsedMs(finalStateCompleted.todayCompletionMs ?? 0);
        }
      }

      setRevealData(reveal);
      setPhase('revealing');
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
        guesses_ai: 0,
        guesses_real: 0,
        unsplash_url: null,
        photographer_name: null,
        context_short: copy.reveal.networkFallback,
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

      let updatedResults: GuessResult[];
      if (isReflectionPlay) {
        const finalState = addReflectionResult(guessResult);
        updatedResults = finalState.rewardedReflectionResults || [];
        setResults(updatedResults);
        const currentLevel = finalState.reflectionLevel ?? 1;
        const currentTotal = currentLevel === 3 ? 1 : currentLevel === 2 ? 2 : 3;
        if (updatedResults.length >= currentTotal) {
          const finalDuration = sessionStartedAt ? Date.now() - sessionStartedAt : 0;
          const finishedState = completeReflection(finalDuration);
          setReflectionLevel(finishedState.reflectionLevel ?? 0);
          setLastReflectionUnlockAt(finishedState.lastReflectionUnlockAt ?? null);
        }
      } else if (isChallengePlay) {
        updatedResults = [...results, guessResult];
        setResults(updatedResults);
        const currentTotal = TOTAL_DAILY_CHALLENGES;
        if (updatedResults.length >= currentTotal || updatedResults.length >= challenges.length) {
          setCompletionMs(sessionStartedAt ? Date.now() - sessionStartedAt : 0);
          setElapsedMs(sessionStartedAt ? Date.now() - sessionStartedAt : 0);
        }
      } else {
        const finalState = addResult(guessResult);
        updatedResults = finalState.todayResults;
        setResults(updatedResults);
        const currentTotal = TOTAL_DAILY_CHALLENGES;
        if (updatedResults.length >= currentTotal || updatedResults.length >= challenges.length) {
          const finalStateCompleted = completeSet(Date.now());
          setStreak(finalStateCompleted.currentStreak);
          setCompletionMs(finalStateCompleted.todayCompletionMs);
          setElapsedMs(finalStateCompleted.todayCompletionMs ?? 0);
        }
      }

      setRevealData(reveal);
      setPhase('revealing');
    } finally {
      if (abortControllerRef.current === abortController) {
        submittingRef.current = false;
        abortControllerRef.current = null;
      }
    }
  }, [phase, challenges, currentIndex, results, advanceToNext, isReflectionPlay, sessionStartedAt, isChallengePlay]);

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

  // Countdown transition bypassed

  if (phase === 'entry') {
    return (
      <>
        <WelcomeScreen onBegin={handleBegin} zenMode={zenMode} setZenMode={setZenMode} isChallengePlay={isChallengePlay} streak={streak} />
        {adOverlayState !== 'none' && <CalmAdTransitionOverlay state={adOverlayState} />}
      </>
    );
  }

  if (phase === 'loading') {
    return (
      <>
        <main className="flex h-[100dvh] flex-col items-center justify-center bg-background cinematic-bg">
          <div className="noise-overlay" />
          <div className="relative z-10 font-mono text-label uppercase tracking-kicker text-muted/60">
            {copy.gameplay.loading}
          </div>
        </main>
        {adOverlayState !== 'none' && <CalmAdTransitionOverlay state={adOverlayState} />}
      </>
    );
  }

  if (phase === 'error') {
    return (
      <>
        <main className="flex h-[100dvh] flex-col items-center justify-center bg-background cinematic-bg px-8">
          <div className="noise-overlay" />
          {isChallengePlay ? (
            <div className="relative z-10 flex flex-col items-center max-w-xs text-center font-sans">
              <div className="font-mono text-label uppercase tracking-label text-muted/50 mb-6">
                // Set Unavailable
              </div>
              <p className="text-sm text-muted font-light leading-relaxed mb-8">
                This set is no longer available.
              </p>
              <Link
                href="/"
                className="min-w-[160px] min-h-14 flex items-center justify-center bg-primary text-background font-mono text-label-lg uppercase tracking-caps font-medium py-3.5 px-6 text-center transition-all hover:bg-primary/90 active:bg-primary/90 active:scale-[0.985] cursor-pointer"
              >
                Play today’s set
              </Link>
            </div>
          ) : (
            <>
              <div className="relative z-10 font-mono text-label uppercase tracking-kicker text-muted/60">
                {copy.errors.sourceUnresolved}
              </div>
              <div className="relative z-10 mt-5 max-w-xs text-center text-sm leading-relaxed text-muted">{error}</div>
            </>
          )}
        </main>
        {adOverlayState !== 'none' && <CalmAdTransitionOverlay state={adOverlayState} />}
      </>
    );
  }

  if (phase === 'completed') {
    return (
      <>
        <ResultsDebrief
          results={results}
          challenges={challenges}
          streak={streak}
          setDate={setDate}
          completionMs={completionMs}
          onUnlockExtraPlay={handleUnlockExtraPlay}
          onRequestReflection={handleRequestAd}
          adAlreadyUnlocked={reflectionLevel >= 3}
          reflectionLevel={reflectionLevel}
          lastReflectionUnlockAt={lastReflectionUnlockAt}
          isChallengePlay={isChallengePlay}
          isFallbackSet={isFallbackSet}
        />
        {adOverlayState !== 'none' && <CalmAdTransitionOverlay state={adOverlayState} level={activeAdLevel} />}
      </>
    );
  }

  if (phase === 'exhausted') {
    return (
      <>
        <ArchiveExhausted
          onUnlockExtraPlay={handleUnlockExtraPlay}
          onRequestReflection={handleRequestAd}
          adAlreadyUnlocked={reflectionLevel >= 3}
          reflectionLevel={reflectionLevel}
          lastReflectionUnlockAt={lastReflectionUnlockAt}
          isFallbackSet={isFallbackSet}
        />
        {adOverlayState !== 'none' && <CalmAdTransitionOverlay state={adOverlayState} level={activeAdLevel} />}
      </>
    );
  }

  const currentChallenge = challenges[currentIndex];

  if (!currentChallenge) {
    return (
      <>
        <main className="flex h-[100dvh] items-center justify-center bg-background cinematic-bg">
          <div className="font-mono text-sm text-muted">{copy.gameplay.missing}</div>
        </main>
        {adOverlayState !== 'none' && <CalmAdTransitionOverlay state={adOverlayState} />}
      </>
    );
  }

  if (phase === 'revealing' && revealData) {
    const totalChallenges = isReflectionPlay 
      ? (getStorage().reflectionLevel === 3 ? 1 : getStorage().reflectionLevel === 2 ? 2 : 3) 
      : TOTAL_DAILY_CHALLENGES;
    return (
      <>
        <RevealScreen
          imageUrl={currentChallenge.image_url}
          challengeId={currentChallenge.id}
          data={revealData}
          result={results[results.length - 1] || null}
          currentIndex={currentIndex}
          total={totalChallenges}
          onNext={() => advanceToNext(results)}
          onTagSelected={handleTagSelected}
        />
        {adOverlayState !== 'none' && <CalmAdTransitionOverlay state={adOverlayState} />}
      </>
    );
  }

  return (
    <>
      <GameShell
        challenge={currentChallenge}
        nextImageUrl={challenges[currentIndex + 1]?.image_url}
        phase={phase}
        timerKey={timerKey}
        timerDuration={TIMER_DURATION}
        timerRunning={timerRunning && !zenMode}
        zenMode={zenMode}
        elapsedMs={elapsedMs}
        currentIndex={currentIndex}
        total={isReflectionPlay ? (getStorage().reflectionLevel === 3 ? 1 : getStorage().reflectionLevel === 2 ? 2 : 3) : TOTAL_DAILY_CHALLENGES}
        results={results}
        socialHint={socialHintFor(currentChallenge, currentIndex)}
        showReasoningTags={showReasoningTags}
        onTimerExpire={handleTimerExpire}
        onDecision={submitGuess}
        onInvestigatingChange={handleInvestigatingChange}
        onTagSelected={handleTagSelected}
      />
      {adOverlayState !== 'none' && <CalmAdTransitionOverlay state={adOverlayState} level={activeAdLevel} />}
    </>
  );
}
