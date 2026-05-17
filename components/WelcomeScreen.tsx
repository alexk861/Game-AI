'use client';

import { copy } from '@/lib/copy';

interface WelcomeScreenProps {
  onBegin: () => void;
}

export default function WelcomeScreen({ onBegin }: WelcomeScreenProps) {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-background text-foreground cinematic-bg">
      <div className="noise-overlay" />
      <section className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-6 pb-[calc(env(safe-area-inset-bottom)+3rem)] pt-[env(safe-area-inset-top)]">
        <div className="mb-auto pt-8 font-mono text-[10px] uppercase tracking-[0.24em] text-muted/45">
          {copy.onboarding.label}
        </div>

        <div className="max-w-sm fade-in">
          <h1 className="text-[3.8rem] font-normal leading-none tracking-normal text-foreground">
            {copy.onboarding.title}
          </h1>
          <p className="mt-5 max-w-[17rem] text-lg leading-snug text-muted">
            {copy.onboarding.subtitle}
          </p>
          <button
            type="button"
            onClick={onBegin}
            className="mt-10 w-full border border-outline bg-foreground px-5 py-5 text-left text-background transition-colors active:translate-y-px"
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
