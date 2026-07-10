'use client';

import { useEffect, useRef, useState } from 'react';

interface TimerProps {
  duration: number; // seconds
  running: boolean;
  onExpire: () => void;
}

export default function Timer({ duration, running, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    const resetId = setTimeout(() => {
      setTimeLeft(duration);
      expiredRef.current = false;
    }, 0);

    return () => clearTimeout(resetId);
  }, [duration]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 0.1);
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          setTimeout(() => onExpire(), 0);
        }
        return next;
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onExpire]);

  const percentage = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 4;
  const displaySeconds = Math.ceil(timeLeft);
  const ringColor = isUrgent ? 'var(--wrong)' : 'var(--text)';

  return (
    <div
      className="relative h-11 w-11 rounded-full"
      data-testid="timer-ring"
      style={{ background: `conic-gradient(${ringColor} ${percentage}%, var(--border-dim) 0)` }}
      role="timer"
      aria-label={running ? `${displaySeconds} seconds remaining` : 'timer idle'}
    >
      <div className="absolute inset-[3px] grid place-items-center rounded-full bg-background">
        <span
          className="font-mono text-label-lg tabular-nums"
          style={{ color: ringColor, fontWeight: isUrgent ? 600 : 400 }}
        >
          {running ? `${displaySeconds}s` : '—'}
        </span>
      </div>
    </div>
  );
}
