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
  const isCritical = timeLeft <= 2;
  const displaySeconds = Math.ceil(timeLeft);

  return (
    <div className="relative w-full">
      {/* Countdown number */}
      <div className="flex items-center justify-center py-2">
        <span className={`font-mono text-xs tabular-nums tracking-wider ${
          isCritical
            ? 'text-error font-semibold'
            : isUrgent
              ? 'text-wrong font-medium'
              : 'text-muted/75'
        }`}>
          {running ? (
            <>
              <span className="text-[9px] uppercase tracking-[0.2em] mr-1.5 opacity-60">TIME</span>
              {displaySeconds}s
            </>
          ) : (
            <span className="text-[9px] uppercase tracking-[0.2em] opacity-40">—</span>
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/10 relative overflow-hidden">
        <div
          className="timer-bar h-full absolute left-0 top-0"
          style={{
            width: `${percentage}%`,
            transitionDuration: '100ms',
            backgroundColor: isCritical
              ? 'var(--error)'
              : isUrgent
                ? 'var(--wrong)'
                : 'var(--outline)',
          }}
        />
      </div>
    </div>
  );
}
