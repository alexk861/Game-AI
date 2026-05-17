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
          ? 'rgba(0, 255, 136, 0.10)'
          : 'rgba(255, 51, 51, 0.10)',
      }}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* Result Icon — sharp square */}
      <div className="relative z-10 reveal-flash">
        <div
          className="w-20 h-20 flex items-center justify-center text-4xl font-bold"
          style={{
            backgroundColor: isCorrect
              ? 'rgba(0, 255, 136, 0.15)'
              : 'rgba(255, 51, 51, 0.15)',
            border: `1px solid ${isCorrect ? 'var(--correct)' : 'var(--wrong)'}`,
            color: isCorrect ? 'var(--correct)' : 'var(--wrong)',
          }}
        >
          {isCorrect ? '✓' : '✗'}
        </div>
      </div>

      {/* Answer Label — terminal style */}
      <div className="relative z-10 mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        {data.answer === 'ai' ? 'CLASSIFICATION: AI-GENERATED' : 'CLASSIFICATION: AUTHENTIC'}
      </div>

      {/* Context Text */}
      <div className="relative z-10 mt-4 px-8 max-w-sm text-center context-reveal">
        <p className="text-sm text-white/80 leading-snug">
          {data.context_short}
        </p>
        {data.answer === 'ai' && data.ai_prompt && (
          <p className="mt-2 text-[10px] font-mono text-muted/60 italic truncate max-w-[280px] mx-auto tracking-wide">
            &quot;{data.ai_prompt}&quot;
          </p>
        )}
        {data.answer === 'real' && (
          <div className="mt-2 text-xs text-muted">
            {data.photographer_name && data.photographer_url && data.unsplash_url ? (
              <span>
                📷 Photo by <a href={`${data.photographer_url}?utm_source=uncanny_mvp&utm_medium=referral`} target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">{data.photographer_name}</a> on <a href={`${data.unsplash_url}?utm_source=uncanny_mvp&utm_medium=referral`} target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Unsplash</a>
              </span>
            ) : data.source_credit ? (
              <span>📷 {data.source_credit}</span>
            ) : null}
          </div>
        )}
      </div>

      {/* Fooled Stat */}
      {totalGuesses > 5 && (
        <div className="relative z-10 mt-4 text-[10px] text-muted/70 font-mono uppercase tracking-[0.15em] context-reveal">
          {fooledPercent}% of players got this wrong
        </div>
      )}
    </div>
  );
}
