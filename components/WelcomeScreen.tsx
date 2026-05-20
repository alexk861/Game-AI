'use client';

import { copy } from '@/lib/copy';
import TopNav from '@/components/TopNav';

interface WelcomeScreenProps {
  onBegin: () => void;
}

export default function WelcomeScreen({ onBegin }: WelcomeScreenProps) {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <TopNav />
      <section className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-8 pb-[calc(env(safe-area-inset-bottom)+4rem)] pt-[env(safe-area-inset-top)]">
        <div className="mb-auto pt-28 font-sans text-[10px] font-light uppercase tracking-[0.24em] text-muted/60">
          {copy.onboarding.label}
        </div>

        <div className="max-w-sm fade-in">
          <h1 className="text-[3.8rem] font-sans font-light leading-none tracking-wide text-foreground">
            {copy.onboarding.title}
          </h1>
          <p className="mt-5 max-w-[17rem] text-lg font-sans font-light leading-snug text-muted">
            {copy.onboarding.subtitle}
          </p>

          {/* Editorial Statement */}
          <div className="mt-12 border-t border-outline/10 pt-8 space-y-4 fade-in">
            <p className="text-sm leading-relaxed text-muted/90 font-sans font-light tracking-wide max-w-xs">
              Five photographic records. Some are authentic captures; others are synthetic representations. You have twelve seconds for each.
            </p>
            <p className="text-[10px] font-sans font-medium uppercase tracking-[0.16em] text-muted/40 pt-1">
              Trust your instinct.
            </p>
          </div>

          <button
            type="button"
            onClick={onBegin}
            className="mt-12 w-full bg-primary text-background py-4 px-6 text-center font-sans text-sm font-medium tracking-wide transition-all duration-150 active:opacity-90 active:scale-[0.985] rounded-[3px] cursor-pointer"
          >
            {copy.onboarding.cta}
          </button>
        </div>
      </section>
    </main>
  );
}
