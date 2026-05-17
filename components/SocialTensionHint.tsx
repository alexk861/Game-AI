'use client';

interface SocialTensionHintProps {
  text: string;
  align?: 'center' | 'left';
}

export default function SocialTensionHint({ text, align = 'center' }: SocialTensionHintProps) {
  return (
    <div
      className={`font-mono text-[10px] uppercase tracking-[0.16em] text-muted/55 ${
        align === 'center' ? 'text-center' : 'text-left'
      }`}
    >
      {text}
    </div>
  );
}
