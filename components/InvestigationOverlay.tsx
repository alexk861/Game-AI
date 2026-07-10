'use client';

import { copy } from '@/lib/copy';

interface InvestigationOverlayProps {
  visible: boolean;
}

export default function InvestigationOverlay({ visible }: InvestigationOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-background/5" />
      
      {/* Single quiet, minimal indicator block in the center-bottom */}
      <div className="absolute bottom-[28%] text-center fade-in">
        <div className="font-mono text-label font-light uppercase tracking-kicker text-foreground/85">
          <span className="bg-background/60 px-2 py-0.5">{copy.investigation.fragments[0]}</span>
        </div>
      </div>
    </div>
  );
}

