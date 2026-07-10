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
        className="min-h-16 border-2 border-real bg-background/70 px-5 py-4 text-center transition-all duration-300 ease-out active:bg-real active:text-background active:scale-[0.97] disabled:opacity-30 cursor-pointer"
      >
        <span className="block font-mono font-light text-label uppercase tracking-label text-muted/85">
          SWIPE RIGHT
        </span>
        <span className="mt-1 block font-mono text-label-lg font-bold uppercase tracking-caps text-real">
          {copy.gameplay.real}
        </span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDecision('ai')}
        className="min-h-16 border-2 border-wrong bg-background/70 px-5 py-4 text-center transition-all duration-300 ease-out active:bg-wrong active:text-background active:scale-[0.97] disabled:opacity-30 cursor-pointer"
      >
        <span className="block font-mono font-light text-label uppercase tracking-label text-muted/85">
          SWIPE LEFT
        </span>
        <span className="mt-1 block font-mono text-label-lg font-bold uppercase tracking-caps text-wrong">
          {copy.gameplay.ai}
        </span>
      </button>
    </div>
  );
}
