'use client';

import type { RevealData } from '@/lib/types';

interface RevealOverlayProps {
  data: RevealData;
  visible: boolean;
}

export default function RevealOverlay({ data, visible }: RevealOverlayProps) {
  if (!visible) return null;

  const isCorrect = data.correct;
  const totalGuesses = data.guesses_ai + data.guesses_real;
  const fooledPercent = totalGuesses > 0
    ? Math.round(
        (data.answer === 'ai'
          ? (data.guesses_real / totalGuesses) * 100
          : (data.guesses_ai / totalGuesses) * 100)
      )
    : 0;

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center"
      style={{
        backgroundColor: isCorrect
          ? 'rgba(0, 255, 136, 0.15)'
          : 'rgba(255, 51, 51, 0.15)',
      }}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* Result Icon */}
      <div className="relative z-10 reveal-flash">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold"
          style={{
            backgroundColor: isCorrect
              ? 'rgba(0, 255, 136, 0.2)'
              : 'rgba(255, 51, 51, 0.2)',
            border: `2px solid ${isCorrect ? 'var(--correct)' : 'var(--wrong)'}`,
            color: isCorrect ? 'var(--correct)' : 'var(--wrong)',
          }}
        >
          {isCorrect ? '✓' : '✗'}
        </div>
      </div>

      {/* Answer Label */}
      <div className="relative z-10 mt-4 font-mono text-sm uppercase tracking-[0.2em] text-muted">
        {data.answer === 'ai' ? 'This was AI-generated' : 'This was real'}
      </div>

      {/* Context Text */}
      <div className="relative z-10 mt-4 px-8 max-w-sm text-center context-reveal">
        <p className="text-sm text-white/80 leading-relaxed">
          {data.context_short}
        </p>
        {data.answer === 'ai' && data.ai_prompt && (
          <p className="mt-2 text-xs font-mono text-muted italic truncate max-w-[280px] mx-auto">
            &quot;{data.ai_prompt}&quot;
          </p>
        )}
        {data.answer === 'real' && data.source_credit && (
          <p className="mt-2 text-xs text-muted">
            📷 {data.source_credit}
          </p>
        )}
      </div>

      {/* Fooled Stat */}
      {totalGuesses > 5 && (
        <div className="relative z-10 mt-4 text-xs text-muted font-mono context-reveal">
          {fooledPercent}% of players got this wrong
        </div>
      )}
    </div>
  );
}
