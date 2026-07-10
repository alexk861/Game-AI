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
    switch (level) {
      case 2:
        return {
          label: '[ EXTRA IMAGES ]',
          title: 'Preparing Next Images',
          description: 'Two extra images remain. Decide carefully.',
        };
      case 3:
        return {
          label: '[ FINAL IMAGE ]',
          title: 'Final Image',
          description: 'One image remains. Decide carefully.',
        };
      default:
        return {
          label: '[ EXTRA ROUND ]',
          title: 'Preparing Extra Round',
          description: 'Three extra images remain. Look closely.',
        };
    }
  };

  const { label, title, description } = getContent();

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/98 backdrop-blur-md transition-all duration-700 ease-out animate-fade-in">
      {/* Film Grain Noise Overlay */}
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-4" />

      <section className="relative z-10 flex w-full max-w-md flex-col items-center px-8 text-center">
        {/* Subtle cinematic label */}
        <div className="font-mono text-label font-light uppercase tracking-kicker text-muted/80 mb-8 animate-pulse">
          {label}
        </div>

        {/* Title */}
        <h2 className="font-sans text-xl md:text-2xl font-light tracking-wide text-foreground mb-4 select-none">
          {title}
        </h2>

        {/* Description */}
        <p className="text-xs text-muted/85 leading-relaxed font-sans font-light max-w-xs mb-10 select-none min-h-[2.5rem]">
          {description}
        </p>

        {/* Cinematic Linear Progress Tracker */}
        <div className="relative w-48 h-[1px] bg-border-dim overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-outline/60 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>
    </div>
  );
}
