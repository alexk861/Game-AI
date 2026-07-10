'use client';

import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import UncannyLogo from '@/components/UncannyLogo';

interface TransitionCountdownProps {
  initialSeconds: number;
  label: string;
  sublabel: string;
  onComplete: () => void;
}

export default function TransitionCountdown({
  initialSeconds,
  label,
  sublabel,
  onComplete,
}: TransitionCountdownProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onCompleteRef = useRef(onComplete);

  // Keep ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Tick timer and trigger haptic events
  useEffect(() => {
    // Initial haptic tick
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Wait 300ms on "1" or transition to "0" before completing for pacing
          setTimeout(() => {
            onCompleteRef.current();
          }, 300);
          return 0;
        }

        // Trigger native vibration tick on each second
        if (Capacitor.isNativePlatform()) {
          Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      {/* Cinematic Film Grain Overlay */}
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.015]" />

      <section className="relative z-10 flex flex-col items-center px-8 text-center max-w-sm">
        {/* Monospaced Diagnostic Label */}
        <div className="font-mono text-[10px] font-light uppercase tracking-[0.3em] text-muted/65 mb-12 animate-pulse select-none">
          [ {label} ]
        </div>

        {/* Central Pulsing Number & Rotating Circular Scanner Ring */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-12">
          {/* Scanner Outer Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-outline/15 animate-[spin_10s_linear_infinite]" />
          
          {/* Active Scanner Sweep Bar */}
          <div className="absolute inset-2 rounded-full border border-t-accent-amber/40 border-r-transparent border-b-transparent border-l-transparent animate-[spin_1.5s_cubic-bezier(0.4,0,0.2,1)_infinite]" />

          {/* Central Pulsing Number Display */}
          <span 
            key={seconds} 
            className="font-sans text-6xl font-light tracking-wide text-foreground/90 select-none animate-[pingScale_0.9s_cubic-bezier(0.16,1,0.3,1)_infinite] z-10"
          >
            {seconds}
          </span>

          {/* Dimmed Iris Logo Watermark Behind Pulse */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
            <UncannyLogo size={72} symbolColor="#f0ece9" />
          </div>
        </div>

        {/* Sublabel Description */}
        <p className="text-[11px] font-mono font-light tracking-widest text-muted/80 leading-relaxed max-w-[19rem] select-none h-8 transition-opacity duration-300">
          {sublabel}
        </p>
      </section>

      {/* Embedded keyframe scale helper inside component if not globally declared */}
      <style jsx global>{`
        @keyframes pingScale {
          0% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          15% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.95;
          }
        }
      `}</style>
    </main>
  );
}
