'use client';

import { useState, useEffect } from 'react';
import { copy } from '@/lib/copy';

interface ReasoningTagsProps {
  visible: boolean;
  onTagSelected: (tag: string) => void;
}

export default function ReasoningTags({ visible, onTagSelected }: ReasoningTagsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  // Reset state when visibility changes
  useEffect(() => {
    if (visible) {
      setSelected(null);
      setHidden(false);
    }
  }, [visible]);

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

  return (
    <div className="reasoning-tags-container">
      <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted/40 mb-2 text-center">
        {copy.reasoning.label}
      </div>
      <div className="flex items-center justify-center gap-2">
        {copy.reasoning.tags.map((tag, index) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleSelect(tag)}
            className={`reasoning-tag-pill reasoning-tag-enter font-mono text-[9px] uppercase tracking-[0.16em] px-3 py-1.5 border transition-colors duration-150 ${
              selected === tag
                ? 'border-foreground text-foreground bg-foreground/8'
                : selected !== null
                  ? 'border-outline-variant/30 text-muted/25 pointer-events-none'
                  : 'border-outline-variant/50 text-muted/60 active:border-foreground active:text-foreground'
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
