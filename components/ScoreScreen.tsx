'use client';

import type { GuessResult } from '@/lib/types';
import { analytics } from '@/lib/analytics';
import { copy, resultReflection } from '@/lib/copy';

interface ScoreScreenProps {
  results: GuessResult[];
  streak: number;
  setDate: string;
}

export default function ScoreScreen({ results, streak, setDate }: ScoreScreenProps) {
  const score = results.filter(r => r.correct).length;
  const message = resultReflection(score);

  const formatSetDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}.${parts[2]}`; // MM.DD
    }
    return dateStr;
  };

  const shareMarks = results
    .map(r => {
      if (r.guess === 'timeout') return '⬚';
      return r.correct ? '▣' : '☒';
    })
    .join(' ');

  const dateFormatted = formatSetDate(setDate);
  const targetDate = setDate || new Date().toISOString().split('T')[0];
  const shareText = `UNCANNY\n${dateFormatted} · ${score}/5\n\n${shareMarks}\n\n${message}\nPlay the same set:\nhttps://game-ai-one.vercel.app/?set=${targetDate}`;

  const handleShare = async () => {
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    const method = canShare ? 'native' : 'copy';
    analytics.shareTapped(score, method);

    if (canShare) {
      try {
        await navigator.share({
          title: 'UNCANNY / DAILY RECORD',
          text: shareText,
        });
      } catch {
        // User cancelled share.
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      const btn = document.getElementById('share-btn');
      if (btn) {
        btn.textContent = 'Copied.';
        setTimeout(() => { btn.textContent = copy.cta.export; }, 2000);
      }
    }
  };

  const handleRestartTest = () => {
    localStorage.removeItem('uncanny_state');
    window.location.reload();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center archive-bg px-6">
      <div className="noise-overlay opacity-[0.08]" />

      <div className="archive-panel p-8 flex flex-col items-center w-full max-w-sm">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted/60 mb-7 fade-in">
          {copy.results.label}
        </div>

        <div className="score-reveal">
          <div className="text-6xl font-normal font-mono tracking-normal">
            {score}<span className="text-2xl text-muted/60">/5</span>
          </div>
        </div>

        <p className="mt-5 text-sm text-muted text-center max-w-xs fade-in leading-relaxed" style={{ animationDelay: '0.3s' }}>
          {message}
        </p>

        <div className="flex gap-2 mt-8 fade-in" style={{ animationDelay: '0.5s' }}>
          {results.map((r, i) => (
            <div
              key={i}
              className={`w-10 h-10 flex items-center justify-center text-xs font-mono border ${
                r.guess === 'timeout'
                  ? 'border-outline-variant bg-surface-container text-muted/50'
                  : r.correct
                    ? 'border-outline text-muted bg-surface'
                    : 'border-ai text-ai bg-ai/10'
              }`}
            >
              {r.guess === 'timeout' ? '0' : r.correct ? '1' : 'x'}
            </div>
          ))}
        </div>

        {streak > 0 && (
          <div className="mt-6 text-[10px] font-mono text-muted/55 uppercase tracking-[0.16em] fade-in" style={{ animationDelay: '0.7s' }}>
            {copy.results.recurrence(streak)}
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 fade-in" style={{ animationDelay: '0.9s' }}>
          <button
            id="share-btn"
            onClick={handleShare}
            className="btn-ghost px-10 py-4 border-outline-variant"
          >
            {copy.cta.export}
          </button>
          <button
            onClick={handleRestartTest}
            className="btn-ghost px-10 py-3 border-ai/50 text-ai"
          >
            {copy.cta.restart}
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 text-[10px] text-muted/40 font-mono uppercase tracking-[0.15em] fade-in" style={{ animationDelay: '1.1s' }}>
        {setDate} / uncanny.app
      </div>
    </div>
  );
}
