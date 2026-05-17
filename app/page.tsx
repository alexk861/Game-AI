'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import SwipeCard from '@/components/SwipeCard';
import Timer from '@/components/Timer';
import ProgressDots from '@/components/ProgressDots';
import RevealOverlay from '@/components/RevealOverlay';
import ScoreScreen from '@/components/ScoreScreen';
import { analytics } from '@/lib/analytics';
import {
  initTodaySession,
  addResult,
  completeSet,
  getStorage,
  hasCompletedToday,
  getResumeIndex,
} from '@/lib/storage';
import type { Challenge, GuessResult, GamePhase, RevealData } from '@/lib/types';

const TIMER_DURATION = 10;
const REVEAL_DURATION = 1800; // ms
const TOTAL_CHALLENGES = 5;

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
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  // ── Fetch daily set on mount ──
  useEffect(() => {
    const loadGame = async () => {
      // Init localStorage session
      const state = initTodaySession();

      // Check if already completed today
      if (hasCompletedToday()) {
        setResults(state.todayResults);
        setStreak(state.currentStreak);
        setSetDate(state.todayDate);
        analytics.returningUser(state.currentStreak, state.totalSetsPlayed);
        setPhase('completed');
        return;
      }

      // Fetch today's challenges
      try {
        const res = await fetch('/api/daily-set');
        if (!res.ok) {
          if (res.status === 404) {
            setError('No challenges for today. Come back tomorrow!');
          } else {
            setError('Something went wrong. Please refresh.');
          }
          setPhase('error');
          return;
        }

        const data = await res.json();
        setChallenges(data.challenges);
        setSetDate(data.date);

        // Resume from where user left off
        const resumeIdx = getResumeIndex();
        if (resumeIdx > 0) {
          setResults(state.todayResults);
          setCurrentIndex(resumeIdx);
        }

        analytics.sessionStarted(data.date);
        setPhase('playing');
        setTimerRunning(true);

        // Fire challenge_started for first challenge
        if (data.challenges.length > 0) {
          const c = data.challenges[resumeIdx] || data.challenges[0];
          analytics.challengeStarted(c.id, c.set_order, c.difficulty);
        }
      } catch {
        setError('Network error. Please check your connection.');
        setPhase('error');
      }
    };

    loadGame();
  }, []);

  // ── Submit guess ──
  const submitGuess = useCallback(async (guess: 'ai' | 'real' | 'timeout') => {
    if (submittingRef.current || phase !== 'playing') return;
    submittingRef.current = true;

    const challenge = challenges[currentIndex];
    if (!challenge) return;

    setTimerRunning(false);
    setPhase('revealing');

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    if (guess === 'timeout') {
      // Timer expired — auto-wrong
      analytics.timerExpired(challenge.id, challenge.set_order);

      const guessResult: GuessResult = {
        challengeId: challenge.id,
        guess: 'timeout',
        correct: false,
        timeRemaining: 0,
      };

      const reveal: RevealData = {
        correct: false,
        answer: 'ai', // placeholder — will be overwritten by API
        context_short: 'Time\'s up! Too slow to decide.',
        ai_prompt: null,
        source_credit: null,
        guesses_ai: 0,
        guesses_real: 0,
      };

      // Still call API to get real answer + increment counter
      try {
        const res = await fetch('/api/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId: challenge.id, guess: 'ai' }),
        });
        if (res.ok) {
          const data = await res.json();
          reveal.answer = data.answer;
          reveal.context_short = data.context_short;
          reveal.ai_prompt = data.ai_prompt;
          reveal.source_credit = data.source_credit;
          reveal.guesses_ai = data.guesses_ai;
          reveal.guesses_real = data.guesses_real;
        }
      } catch {
        // Silent fail — show timeout anyway
      }

      setRevealData(reveal);
      analytics.resultWrong(challenge.id, challenge.set_order, challenge.difficulty);
      analytics.challengeRevealed(challenge.id, false);

      const updatedResults = [...results, guessResult];
      setResults(updatedResults);
      addResult(guessResult);

      // Auto-advance after reveal
      setTimeout(() => advanceToNext(updatedResults), REVEAL_DURATION);
    } else {
      // Normal guess
      try {
        const res = await fetch('/api/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId: challenge.id, guess }),
        });

        if (!res.ok) throw new Error('Failed to submit guess');

        const data = await res.json();
        const timeRemaining = TIMER_DURATION; // Approximate — we stopped the timer

        const guessResult: GuessResult = {
          challengeId: challenge.id,
          guess,
          correct: data.correct,
          timeRemaining,
        };

        const reveal: RevealData = {
          correct: data.correct,
          answer: data.answer,
          context_short: data.context_short,
          ai_prompt: data.ai_prompt,
          source_credit: data.source_credit,
          guesses_ai: data.guesses_ai,
          guesses_real: data.guesses_real,
        };

        setRevealData(reveal);

        analytics.guessSubmitted(challenge.id, guess, data.correct, timeRemaining);
        if (data.correct) {
          analytics.resultCorrect(challenge.id, challenge.set_order, challenge.difficulty);
        } else {
          analytics.resultWrong(challenge.id, challenge.set_order, challenge.difficulty);
        }
        analytics.challengeRevealed(challenge.id, data.correct);

        const updatedResults = [...results, guessResult];
        setResults(updatedResults);
        addResult(guessResult);

        // Auto-advance after reveal
        setTimeout(() => advanceToNext(updatedResults), REVEAL_DURATION);
      } catch {
        // On API failure, still advance
        const guessResult: GuessResult = {
          challengeId: challenge.id,
          guess,
          correct: false,
          timeRemaining: 0,
        };
        const updatedResults = [...results, guessResult];
        setResults(updatedResults);
        addResult(guessResult);
        setTimeout(() => advanceToNext(updatedResults), REVEAL_DURATION);
      }
    }

    submittingRef.current = false;
  }, [phase, challenges, currentIndex, results]);

  // ── Advance to next challenge or complete ──
  const advanceToNext = useCallback((currentResults: GuessResult[]) => {
    const nextIndex = currentResults.length;

    if (nextIndex >= TOTAL_CHALLENGES || nextIndex >= challenges.length) {
      // Set completed
      const finalState = completeSet();
      setStreak(finalState.currentStreak);

      const score = currentResults.filter(r => r.correct).length;
      analytics.setCompleted(score, finalState.currentStreak, setDate);

      setPhase('completed');
    } else {
      // Next challenge
      setCurrentIndex(nextIndex);
      setRevealData(null);
      setTimerKey(prev => prev + 1); // reset timer
      setPhase('playing');
      setTimerRunning(true);

      const nextChallenge = challenges[nextIndex];
      if (nextChallenge) {
        analytics.challengeStarted(nextChallenge.id, nextChallenge.set_order, nextChallenge.difficulty);
      }
    }
  }, [challenges, setDate]);

  // ── Timer expired handler ──
  const handleTimerExpire = useCallback(() => {
    if (phase === 'playing') {
      submitGuess('timeout');
    }
  }, [phase, submitGuess]);

  // ── Handle swipe ──
  const handleSwipe = useCallback((direction: 'ai' | 'real') => {
    if (phase === 'playing') {
      submitGuess(direction);
    }
  }, [phase, submitGuess]);

  // ── Render ──

  // Loading State
  if (phase === 'loading') {
    return (
      <main className="h-[100dvh] flex flex-col items-center justify-center bg-background">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted animate-pulse">
          Loading...
        </div>
      </main>
    );
  }

  // Error State
  if (phase === 'error') {
    return (
      <main className="h-[100dvh] flex flex-col items-center justify-center bg-background px-8">
        <div className="font-mono text-4xl mb-4">👁️</div>
        <div className="font-mono text-sm text-muted text-center">{error}</div>
      </main>
    );
  }

  // Completed State
  if (phase === 'completed') {
    return (
      <main className="h-[100dvh] relative bg-background">
        <ScoreScreen results={results} streak={streak} setDate={setDate} />
      </main>
    );
  }

  // Playing / Revealing State
  const currentChallenge = challenges[currentIndex];
  const nextChallenge = challenges[currentIndex + 1];

  if (!currentChallenge) {
    return (
      <main className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="font-mono text-sm text-muted">No challenge found</div>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      {/* Top Bar: Timer + Progress */}
      <div className="relative z-20 pt-[env(safe-area-inset-top)]">
        <Timer
          key={timerKey}
          duration={TIMER_DURATION}
          running={timerRunning}
          onExpire={handleTimerExpire}
        />
        <div className="flex items-center justify-between px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Uncanny
          </div>
          <ProgressDots
            total={TOTAL_CHALLENGES}
            current={currentIndex}
            results={results.map(r => ({ correct: r.correct }))}
          />
          <div className="font-mono text-[10px] text-muted">
            {currentIndex + 1}/{TOTAL_CHALLENGES}
          </div>
        </div>
      </div>

      {/* Challenge Area */}
      <div className="flex-1 relative">
        <SwipeCard
          key={currentChallenge.id}
          imageUrl={currentChallenge.image_url}
          onSwipe={handleSwipe}
          disabled={phase !== 'playing'}
          onNextImageUrl={nextChallenge?.image_url}
        />

        {/* Reveal Overlay */}
        {revealData && (
          <RevealOverlay data={revealData} visible={phase === 'revealing'} />
        )}
      </div>
    </main>
  );
}
