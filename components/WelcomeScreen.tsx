'use client';

import { copy } from '@/lib/copy';
import TopNav from '@/components/TopNav';

interface WelcomeScreenProps {
  onBegin: () => void;
}

export default function WelcomeScreen({ onBegin }: WelcomeScreenProps) {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-background text-foreground scroll-smooth relative">
      <div className="noise-overlay" />
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
            className="mt-12 w-full bg-primary text-background py-4 px-6 text-center font-sans text-sm font-medium tracking-wide transition-all duration-300 ease-out hover:bg-primary/95 hover:scale-[1.006] active:scale-[0.97] rounded-[3px] cursor-pointer"
          >
            {copy.onboarding.cta}
          </button>
        </div>

        {/* Below-the-fold Editorial Content Section for AdSense Value Compliance */}
        <div className="mt-28 border-t border-outline/10 pt-16 max-w-sm pb-16 space-y-12">
          <div className="space-y-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              01 / Project Specimen
            </h2>
            <p className="text-sm leading-relaxed text-muted/75 font-sans font-light">
              UNCANNY is a forensic perception repository operating at the intersection of neural image synthesis and clinical human observation. The target of this record is to benchmark human intuition in an era where synthetic representations are mathematically indistinguishable from organic capture.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              02 / Cognitive Illusion
            </h2>
            <p className="text-sm leading-relaxed text-muted/75 font-sans font-light">
              As deep generative models scale, they exploit minor shortcuts in natural lighting geometry and organic texture synthesis. Human perception relies on the Uncanny Valley anomaly—a biological defense mechanism triggered when an artificial specimen mimics authentic biological cues with slight systemic faults.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              03 / Registry Protocols
            </h2>
            <p className="text-sm leading-relaxed text-muted/75 font-sans font-light">
              Every daily board presents five unverified visual records scheduled at midnight. Observer consensus averages are calculated in real-time, mapping the shifting boundaries between public belief and verifiable organic origins.
            </p>
          </div>

          {/* Standard Institutional Footer Links */}
          <div className="pt-12 border-t border-outline/5 flex flex-col gap-4 font-mono text-[9px] uppercase tracking-wider text-muted/40">
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-foreground transition-all">
                Privacy Policy
              </a>
              <span>·</span>
              <a href="/terms" className="hover:text-foreground transition-all">
                Terms of Service
              </a>
            </div>
            <div>
              © 2026 UNCANNY / ca-pub-3572878125126394
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
