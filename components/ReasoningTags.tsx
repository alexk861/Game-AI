'use client';

import { useState, useEffect } from 'react';
import { copy, getDynamicTags } from '@/lib/copy';

interface ReasoningTagsProps {
  visible: boolean;
  challengeId?: string;
  onTagSelected: (tag: string) => void;
}

export default function ReasoningTags({ visible, challengeId, onTagSelected }: ReasoningTagsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [prevVisible, setPrevVisible] = useState(visible);

  // Reset state when visibility changes
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setSelected(null);
      setHidden(false);
    }
  }

  // Auto-hide after selection (quick dismiss)
  useEffect(() => {
    if (selected) {
      const timer = setTimeout(() => setHidden(true), 600);
      return () => clearTimeout(timer);
    }
  }, [selected]);

  if (!visible || hidden) return null;

  const handleSelect = (tag: string) => {
    if (selected) return;
    setSelected(tag);
    onTagSelected(tag);
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const tags = getDynamicTags(challengeId);

  return (
    <div className="reasoning-tags-container">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.24em] text-foreground/95 mb-2 text-center drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)] font-medium">
        {copy.reasoning.label}
      </div>
      <div className="flex items-center justify-center gap-2">
        {tags.map((tag, index) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleSelect(tag)}
            className={`reasoning-tag-pill reasoning-tag-enter font-mono text-[9px] uppercase tracking-[0.16em] px-3.5 py-2 border transition-all duration-150 rounded-[2px] shadow-lg ${
              selected === tag
                ? 'border-foreground text-background bg-foreground font-medium scale-[1.03]'
                : selected !== null
                  ? 'border-outline-variant/30 text-muted/30 pointer-events-none bg-surface/20'
                  : 'border-outline/65 text-foreground bg-surface/95 backdrop-blur-[1px] hover:bg-surface-container hover:scale-[1.01] active:scale-[0.98] active:border-foreground'
            }`}
            style={{ animationDelay: `${index * 60}ms` }}
            disabled={selected !== null && selected !== tag}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

