'use client';

import { useEffect, useState } from 'react';

interface CalmAdTransitionOverlayProps {
  state: 'decompressing' | 'reentering';
  level?: number;
}

export default function CalmAdTransitionOverlay({ state, level = 1 }: CalmAdTransitionOverlayProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (state === 'decompressing') {
      setProgress(0);
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min(100, (elapsed / 2500) * 100);
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [state]);

  const getContent = () => {
    if (state === 'decompressing') {
      switch (level) {
        case 2:
          return {
            label: '[ DEEPENING OBSERVATION ]',
            title: 'Deepening Observation',
            description: 'Accessing deeper black archive records. Prepare your instinct.',
          };
        case 3:
          return {
            label: '[ ACCESSING FINAL ANOMALY ]',
            title: 'Accessing Final Anomaly',
            description: 'Accessing final unstable record. This archive was not intended for prolonged observation.',
          };
        default:
          return {
            label: '[ DAILY SEQUENCE RECORDED ]',
            title: 'Requesting Unstable Record',
            description: 'A sponsor-supported reflection will play.',
          };
      }
    } else {
      switch (level) {
        case 2:
          return {
            label: '[ Entering Black Archive ]',
            title: 'Entering Black Archive',
            description: 'Two black archive records remain. Observe closely.',
          };
        case 3:
          return {
            label: '[ Isolating Final Anomaly ]',
            title: 'Isolating Final Anomaly',
            description: 'One final anomaly record remains. Watch.',
          };
        default:
          return {
            label: '[ UNSTABLE ARCHIVE RESTORED ]',
            title: 'Restoring Tension',
            description: 'Prepare your instinct. Three unstable records remain.',
          };
      }
    }
  };

  const { label, title, description } = getContent();

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/98 backdrop-blur-md transition-all duration-700 ease-out animate-fade-in">
      {/* Film Grain Noise Overlay */}
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-4" />

      <section className="relative z-10 flex w-full max-w-md flex-col items-center px-8 text-center">
        {/* Subtle cinematic label */}
        <div className="font-sans text-[9px] font-light uppercase tracking-[0.25em] text-muted/30 mb-8 animate-pulse">
          {label}
        </div>

        {/* Title */}
        <h2 className="font-sans text-xl md:text-2xl font-light tracking-wide text-foreground mb-4 select-none">
          {title}
        </h2>

        {/* Description */}
        <p className="text-xs text-muted/50 leading-relaxed font-sans font-light max-w-xs mb-10 select-none min-h-[2.5rem]">
          {description}
        </p>

        {/* Cinematic Linear Progress Tracker */}
        <div className="relative w-48 h-[1px] bg-outline/10 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-accent-amber/60 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>
    </div>
  );
}
