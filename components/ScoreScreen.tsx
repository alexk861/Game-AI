'use client';

import type { GuessResult } from '@/lib/types';
import { analytics } from '@/lib/analytics';

interface ScoreScreenProps {
  results: GuessResult[];
  streak: number;
  setDate: string;
}

const SCORE_MESSAGES: Record<number, string> = {
  5: 'Flawless. You can\'t be fooled.',
  4: 'Sharp eyes. Almost perfect.',
  3: 'Not bad. Reality is tricky.',
  2: 'The machines are winning.',
  1: 'You got played.',
  0: 'AI owns your perception.',
};

export default function ScoreScreen({ results, streak, setDate }: ScoreScreenProps) {
  const score = results.filter(r => r.correct).length;
  const message = SCORE_MESSAGES[score] || 'How did you do?';

  const emojiStrip = results
    .map(r => {
      if (r.guess === 'timeout') return '⬛';
      return r.correct ? '🟩' : '🟥';
    })
    .join('');

  const shareText = `Uncanny — Daily Reality Check\n🤖${emojiStrip} ${score}/5\nDay ${streak} 🔥\nCan you spot the fakes?\nhttps://uncanny.app`;

  const handleShare = async () => {
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    const method = canShare ? 'native' : 'copy';
    analytics.shareTapped(score, method);

    if (canShare) {
      try {
        await navigator.share({
          title: 'Uncanny — Daily Reality Check',
          text: shareText,
        });
      } catch {
        // User cancelled share — that's fine
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      // Brief visual feedback
      const btn = document.getElementById('share-btn');
      if (btn) {
        btn.textContent = 'COPIED!';
        setTimeout(() => {
          btn.textContent = 'SHARE MY SCORE';
        }, 2000);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background px-6">
      {/* Title */}
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted mb-6 fade-in">
        Reality Score
      </div>

      {/* Score */}
      <div className="score-reveal">
        <div className="text-7xl font-bold font-mono tracking-tight">
          {score}<span className="text-3xl text-muted">/5</span>
        </div>
      </div>

      {/* Message */}
      <p className="mt-4 text-lg text-white/70 text-center max-w-xs fade-in" style={{ animationDelay: '0.3s' }}>
        {message}
      </p>

      {/* Result Strip */}
      <div className="flex gap-3 mt-8 fade-in" style={{ animationDelay: '0.5s' }}>
        {results.map((r, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
              r.guess === 'timeout'
                ? 'bg-white/10 text-muted'
                : r.correct
                  ? 'bg-correct/20 text-correct border border-correct/30'
                  : 'bg-wrong/20 text-wrong border border-wrong/30'
            }`}
          >
            {r.guess === 'timeout' ? '–' : r.correct ? '✓' : '✗'}
          </div>
        ))}
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="mt-6 text-sm font-mono text-muted fade-in" style={{ animationDelay: '0.7s' }}>
          🔥 Day {streak} Streak
        </div>
      )}

      {/* Share Button */}
      <button
        id="share-btn"
        onClick={handleShare}
        className="mt-10 px-8 py-4 bg-white text-black font-mono text-sm font-bold uppercase tracking-wider
                   rounded-lg transition-all duration-200 hover:bg-white/90 active:scale-95 fade-in"
        style={{ animationDelay: '0.9s' }}
      >
        Share My Score
      </button>

      {/* Footer */}
      <div className="absolute bottom-6 text-xs text-muted/50 font-mono fade-in" style={{ animationDelay: '1.1s' }}>
        {setDate} · uncanny.app
      </div>
    </div>
  );
}
