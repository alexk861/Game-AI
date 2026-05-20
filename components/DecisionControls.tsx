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
        className="min-h-16 bg-surface px-5 py-4 text-left transition-all duration-200 hover:bg-surface-container active:scale-[0.98] disabled:opacity-30 rounded-[3px] cursor-pointer"
      >
        <span className="block font-sans font-light text-[9px] uppercase tracking-[0.2em] text-muted/50">
          {copy.gameplay.decisionKicker}
        </span>
        <span className="mt-1 block text-lg font-sans font-light tracking-wide text-foreground">
          {copy.gameplay.real}
        </span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDecision('ai')}
        className="min-h-16 bg-surface px-5 py-4 text-left transition-all duration-200 hover:bg-surface-container active:scale-[0.98] disabled:opacity-30 rounded-[3px] cursor-pointer"
      >
        <span className="block font-sans font-light text-[9px] uppercase tracking-[0.2em] text-muted/50">
          {copy.gameplay.decisionKicker}
        </span>
        <span className="mt-1 block text-lg font-sans font-light tracking-wide text-foreground">
          {copy.gameplay.ai}
        </span>
      </button>
    </div>
  );
}
