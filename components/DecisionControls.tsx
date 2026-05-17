'use client';

import { copy } from '@/lib/copy';

interface DecisionControlsProps {
  disabled: boolean;
  onDecision: (choice: 'ai' | 'real') => void;
}

export default function DecisionControls({ disabled, onDecision }: DecisionControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDecision('real')}
        className="min-h-16 border border-outline bg-surface/35 px-4 py-4 text-left transition-colors active:translate-y-px disabled:opacity-40"
      >
        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted/55">
          {copy.gameplay.decisionKicker}
        </span>
        <span className="mt-1 block text-xl font-normal tracking-normal text-foreground">
          {copy.gameplay.real}
        </span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDecision('ai')}
        className="min-h-16 border border-ai/70 bg-ai/10 px-4 py-4 text-left transition-colors active:translate-y-px disabled:opacity-40"
      >
        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted/55">
          {copy.gameplay.decisionKicker}
        </span>
        <span className="mt-1 block text-xl font-normal tracking-normal text-foreground">
          {copy.gameplay.ai}
        </span>
      </button>
    </div>
  );
}
