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
        <div className="font-sans text-[10px] font-light uppercase tracking-[0.24em] text-foreground/50">
          {copy.investigation.fragments[0]}
        </div>
      </div>
    </div>
  );
}

