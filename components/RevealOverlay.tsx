'use client';

import type { RevealData } from '@/lib/types';
import { copy, revealConsensus, revealOrigin } from '@/lib/copy';

interface RevealOverlayProps {
  data: RevealData;
  visible: boolean;
}

export default function RevealOverlay({ data, visible }: RevealOverlayProps) {
  if (!visible) return null;

  const answerLabel = data.answer === 'ai'
    ? copy.reveal.ai
    : copy.reveal.real;
  const verdictLabel = data.correct
    ? copy.reveal.correct
    : copy.reveal.wrong;

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8"
      style={{ backgroundColor: 'rgba(19, 19, 19, 0.78)' }}
    >
      <div className="absolute inset-0 bg-background/25" />
      <div className="absolute inset-0 scanline-field opacity-60" />

      <div className="relative z-10 reveal-flash w-full max-w-sm border border-outline-variant bg-surface/90 px-6 py-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted/55">
          {verdictLabel}
        </div>

        <div className="mt-5 font-mono text-[12px] uppercase tracking-[0.2em] text-foreground">
          {answerLabel}
        </div>

        <p className="mt-5 text-sm text-muted leading-relaxed">
          {revealOrigin(data)}
        </p>

        {data.answer === 'ai' && data.ai_prompt && (
          <p className="mt-4 border-l border-ai/50 pl-3 text-[10px] font-mono text-muted/60 italic leading-relaxed line-clamp-2">
            &quot;{data.ai_prompt}&quot;
          </p>
        )}

        {data.answer === 'real' && (
          <div className="mt-4 text-[10px] font-mono text-muted/60 uppercase tracking-[0.12em] leading-relaxed">
            {data.photographer_name && data.photographer_url && data.unsplash_url ? (
              <span>
                observed by <a href={`${data.photographer_url}?utm_source=uncanny_mvp&utm_medium=referral`} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">{data.photographer_name}</a> via <a href={`${data.unsplash_url}?utm_source=uncanny_mvp&utm_medium=referral`} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Unsplash</a>
              </span>
            ) : data.source_credit ? (
              <span>{data.source_credit}</span>
            ) : (
            <span>{copy.reveal.unknownOrigin}</span>
            )}
          </div>
        )}

        {data.guesses_ai + data.guesses_real > 5 && (
          <div className="mt-5 border-t border-outline-variant pt-4 text-[10px] text-muted/55 font-mono uppercase tracking-[0.15em]">
            {revealConsensus(data)}
          </div>
        )}
      </div>
    </div>
  );
}
