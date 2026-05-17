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
      <div className="absolute top-[15%] left-[10%] space-y-4">
        {copy.investigation.fragments.slice(0, 2).map((fragment, i) => (
          <div key={fragment} className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/70 opacity-80" style={{ transform: `translateX(${i * 12}px)` }}>
            {fragment}
          </div>
        ))}
      </div>
      <div className="absolute bottom-[20%] right-[10%] max-w-[13rem] space-y-4 text-right">
        {copy.investigation.fragments.slice(2, 4).map((fragment, i) => (
          <div key={fragment} className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/70 opacity-80" style={{ transform: `translateX(-${i * 12}px)` }}>
            {fragment}
          </div>
        ))}
      </div>
      <div className="absolute top-[40%] right-[15%] max-w-[13rem] text-right">
        {copy.investigation.fragments.slice(4, 5).map(fragment => (
          <div key={fragment} className="font-mono text-[9px] uppercase tracking-[0.2em] text-error/80 opacity-90 font-bold">
            {fragment}
          </div>
        ))}
      </div>
      
      {/* Targeting Reticle */}
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-error/70"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-error/70"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-error/70"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-error/70"></div>
        <div className="absolute left-1/2 top-1/2 w-1 h-1 bg-error/90 -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  );
}
