'use client';

import { copy } from '@/lib/copy';

interface CrowdSplitBarProps {
  guessesAi: number;
  guessesReal: number;
  answer: 'ai' | 'real';
}

export default function CrowdSplitBar({ guessesAi, guessesReal, answer }: CrowdSplitBarProps) {
  const total = guessesAi + guessesReal;

  if (total <= 0) {
    return (
      <div className="flex flex-col gap-2" data-testid="crowd-split">
        <span className="font-mono text-label uppercase tracking-label text-muted">
          {copy.reveal.noConsensusYet}
        </span>
        <div className="flex h-1 w-full opacity-30">
          <span className="w-1/2 bg-wrong" />
          <span className="w-1/2 bg-real" />
        </div>
      </div>
    );
  }

  const aiPercent = Math.round((guessesAi / total) * 100);
  const realPercent = 100 - aiPercent;
  // The "fooled" share = players who guessed against the true answer.
  const fooledPercent = answer === 'ai' ? realPercent : aiPercent;
  const majorityLabel =
    answer === 'ai' ? copy.reveal.saidAi(aiPercent) : copy.reveal.saidReal(realPercent);

  return (
    <div className="flex flex-col gap-2" data-testid="crowd-split">
      <div className="flex items-baseline justify-between font-mono text-label uppercase tracking-label">
        <span className={answer === 'ai' ? 'text-wrong' : 'text-real'}>{majorityLabel}</span>
        <span className="text-muted">{copy.reveal.fooled(fooledPercent)}</span>
      </div>
      <div className="flex h-1 w-full gap-px" role="img" aria-label={`${aiPercent}% guessed AI, ${realPercent}% guessed real`}>
        <span className="bg-wrong" style={{ width: `${aiPercent}%` }} />
        <span className="flex-1 bg-real" />
      </div>
    </div>
  );
}
