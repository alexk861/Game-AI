'use client';

import { copy } from '@/lib/copy';

interface VerdictStampProps {
  answer: 'ai' | 'real';
}

export default function VerdictStamp({ answer }: VerdictStampProps) {
  const isAi = answer === 'ai';

  return (
    <div className="-rotate-[8deg]" data-testid="verdict-stamp">
      <div
        className={`reveal-verdict-scale inline-block border-2 bg-background/40 px-4 py-2 font-mono text-lg font-bold uppercase tracking-caps backdrop-blur-[2px] ${
          isAi ? 'border-wrong text-wrong' : 'border-real text-real'
        }`}
      >
        {isAi ? copy.reveal.stampAi : copy.reveal.stampReal}
      </div>
    </div>
  );
}
