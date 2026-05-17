'use client';

import { copy } from '@/lib/copy';

interface InvestigationOverlayProps {
  visible: boolean;
}

export default function InvestigationOverlay({ visible }: InvestigationOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden investigation-pulse">
      <div className="absolute inset-0 bg-background/18" />
      <div className="absolute inset-0 opacity-45 scanline-field" />
      <div className="noise-overlay" style={{ opacity: 0.34 }} />
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-background/72 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background/78 to-transparent" />
      <div className="absolute left-4 top-4 space-y-2">
        {copy.investigation.fragments.slice(0, 3).map(fragment => (
          <div key={fragment} className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/58">
            {fragment}
          </div>
        ))}
      </div>
      <div className="absolute bottom-5 right-4 max-w-[13rem] space-y-2 text-right">
        {copy.investigation.fragments.slice(3).map(fragment => (
          <div key={fragment} className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/58">
            {fragment}
          </div>
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 border border-muted/10" />
    </div>
  );
}
