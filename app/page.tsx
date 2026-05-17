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
const REVEAL_DURATION = 1800;
const TOTAL_CHALLENGES = 5;

// Social tension hints based on difficulty
const TENSION_HINTS = [
  'most players hesitate here',
  '68% got this wrong',
  'only 12% spotted this one',
  'this one fools almost everyone',
  'harder than it looks',
];

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
      const state = initTodaySession();

      if (hasCompletedToday()) {
        setResults(state.todayResults);
        setStreak(state.currentStreak);
        setSetDate(state.todayDate);
        analytics.returningUser(state.currentStreak, state.totalSetsPlayed);
        setPhase('completed');
        return;
      }

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

        const resumeIdx = getResumeIndex();
        if (resumeIdx > 0) {
          setResults(state.todayResults);
          setCurrentIndex(resumeIdx);
        }

        analytics.sessionStarted(data.date);
        setPhase('playing');
        setTimerRunning(true);

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

  // ── Advance to next challenge or complete ──
  const advanceToNext = useCallback((currentResults: GuessResult[]) => {
    const nextIndex = currentResults.length;

    if (nextIndex >= TOTAL_CHALLENGES || nextIndex >= challenges.length) {
      const finalState = completeSet();
      setStreak(finalState.currentStreak);
      const score = currentResults.filter(r => r.correct).length;
      analytics.setCompleted(score, finalState.currentStreak, setDate);
      setPhase('completed');
    } else {
      setCurrentIndex(nextIndex);
      setRevealData(null);
      setTimerKey(prev => prev + 1);
      setPhase('playing');
      setTimerRunning(true);

      const nextChallenge = challenges[nextIndex];
      if (nextChallenge) {
        analytics.challengeStarted(nextChallenge.id, nextChallenge.set_order, nextChallenge.difficulty);
      }
    }
  }, [challenges, setDate]);

  // ── Submit guess ──
  const submitGuess = useCallback(async (guess: 'ai' | 'real' | 'timeout') => {
    if (submittingRef.current || phase !== 'playing') return;
    submittingRef.current = true;

    const challenge = challenges[currentIndex];
    if (!challenge) return;

    setTimerRunning(false);
    setPhase('revealing');

    if (navigator.vibrate) navigator.vibrate(50);

    if (guess === 'timeout') {
      analytics.timerExpired(challenge.id, challenge.set_order);

      const guessResult: GuessResult = {
        challengeId: challenge.id,
        guess: 'timeout',
        correct: false,
        timeRemaining: 0,
      };

      const reveal: RevealData = {
        correct: false,
        answer: 'ai',
        context_short: 'Time\'s up! Too slow to decide.',
        ai_prompt: null,
        source_credit: null,
        photographer_name: null,
        photographer_url: null,
        unsplash_url: null,
        guesses_ai: 0,
        guesses_real: 0,
      };

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
        // Silent fail
      }

      setRevealData(reveal);
      analytics.resultWrong(challenge.id, challenge.set_order, challenge.difficulty);
      analytics.challengeRevealed(challenge.id, false);

      const updatedResults = [...results, guessResult];
      setResults(updatedResults);
      addResult(guessResult);
      setTimeout(() => advanceToNext(updatedResults), REVEAL_DURATION);
    } else {
      try {
        const res = await fetch('/api/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId: challenge.id, guess }),
        });

        if (!res.ok) throw new Error('Failed to submit guess');

        const data = await res.json();
        const timeRemaining = TIMER_DURATION;

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
          photographer_name: data.photographer_name,
          photographer_url: data.photographer_url,
          unsplash_url: data.unsplash_url,
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
        setTimeout(() => advanceToNext(updatedResults), REVEAL_DURATION);
      } catch {
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
  }, [phase, challenges, currentIndex, results, advanceToNext]);

  const handleTimerExpire = useCallback(() => {
    if (phase === 'playing') {
      submitGuess('timeout');
    }
  }, [phase, submitGuess]);

  const handleSwipe = useCallback((direction: 'ai' | 'real') => {
    if (phase === 'playing') {
      submitGuess(direction);
    }
  }, [phase, submitGuess]);

  // ── Render ──

  if (phase === 'loading') {
    return (
      <main className="h-[100dvh] flex flex-col items-center justify-center bg-background">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted animate-pulse">
          Loading...
        </div>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="h-[100dvh] flex flex-col items-center justify-center bg-background px-8">
        <div className="font-mono text-4xl mb-4">👁️</div>
        <div className="font-mono text-sm text-muted text-center">{error}</div>
      </main>
    );
  }

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

  // Pick a social tension hint based on challenge difficulty
  const tensionHint = currentChallenge.difficulty >= 3
    ? TENSION_HINTS[currentIndex % TENSION_HINTS.length]
    : undefined;

  return (
    <main className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      {/* ── Compact Top Bar ── */}
      <div className="relative z-20 flex-shrink-0 pt-[env(safe-area-inset-top)]">
        <Timer
          key={timerKey}
          duration={TIMER_DURATION}
          running={timerRunning}
          onExpire={handleTimerExpire}
        />
        <div className="flex items-center justify-between px-4 py-2">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/60">
            Uncanny
          </div>
          <ProgressDots
            total={TOTAL_CHALLENGES}
            current={currentIndex}
            results={results.map(r => ({ correct: r.correct }))}
          />
          <div className="font-mono text-[9px] text-muted/60">
            {currentIndex + 1}/{TOTAL_CHALLENGES}
          </div>
        </div>
      </div>

      {/* ── Challenge Area: image + decision ── */}
      <div className="flex-1 relative min-h-0">
        <SwipeCard
          key={currentChallenge.id}
          challengeId={currentChallenge.id}
          difficulty={currentChallenge.difficulty}
          imageUrl={currentChallenge.image_url}
          onSwipe={handleSwipe}
          disabled={phase !== 'playing'}
          onNextImageUrl={nextChallenge?.image_url}
          communityHint={tensionHint}
        />

        {/* Reveal Overlay */}
        {revealData && (
          <RevealOverlay data={revealData} visible={phase === 'revealing'} />
        )}
      </div>
    </main>
  );
}
