'use client';

interface SocialTensionHintProps {
  text: string;
  align?: 'center' | 'left';
}

export default function SocialTensionHint({ text, align = 'center' }: SocialTensionHintProps) {
  return (
    <div
      className={`font-mono text-label uppercase tracking-label text-foreground/95 ${
        align === 'center' ? 'text-center' : 'text-left'
      }`}
    >
      <span className="bg-background/60 px-2 py-0.5">{text}</span>
    </div>
  );
}
