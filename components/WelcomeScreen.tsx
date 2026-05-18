'use client';

import { copy } from '@/lib/copy';
import TopNav from '@/components/TopNav';

interface WelcomeScreenProps {
  onBegin: () => void;
}

export default function WelcomeScreen({ onBegin }: WelcomeScreenProps) {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-background text-foreground cinematic-bg">
      <div className="noise-overlay" />
      <TopNav />
      <section className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-6 pb-[calc(env(safe-area-inset-bottom)+3rem)] pt-[env(safe-area-inset-top)]">
        <div className="mb-auto pt-32 font-mono text-[10px] uppercase tracking-[0.24em] text-muted/45">
          {copy.onboarding.label}
        </div>

        <div className="max-w-sm fade-in">
          <h1 className="text-[3.8rem] font-normal leading-none tracking-normal text-foreground">
            {copy.onboarding.title}
          </h1>
          <p className="mt-5 max-w-[17rem] text-lg leading-snug text-muted">
            {copy.onboarding.subtitle}
          </p>

          {/* Challenge Briefing */}
          <div className="mt-8 border-l border-outline-variant/70 pl-4 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted/50">
              how it works
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center border border-outline-variant text-[9px] font-mono text-muted/60">5</span>
              <span className="text-sm leading-snug text-muted/80">Five images. Each could be real or AI-generated.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center border border-ai/50 text-[9px] font-mono text-error/70">?</span>
              <span className="text-sm leading-snug text-muted/80">Decide for each: <strong className="text-foreground/90">Real</strong> or <strong className="text-error/90">AI</strong></span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center border border-outline-variant text-[9px] font-mono text-muted/60">⏱</span>
              <span className="text-sm leading-snug text-muted/80">12 seconds per image. Trust your instinct.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBegin}
            className="mt-10 w-full border border-outline bg-foreground px-5 py-5 text-left text-background transition-colors active:translate-y-px hover:bg-primary/90"
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-background/65">
              {copy.onboarding.ctaKicker}
            </span>
            <span className="mt-1 block text-xl">{copy.onboarding.cta}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
