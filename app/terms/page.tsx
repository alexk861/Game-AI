'use client';

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-background text-foreground px-8 py-16 max-w-2xl mx-auto relative">
      <div className="noise-overlay" />
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/50 mb-8">
        classification: public / terms of service
      </div>
      <h1 className="text-3xl font-sans font-light tracking-wide mb-8">
        TERMS OF SERVICE
      </h1>
      <div className="space-y-6 text-sm text-muted/80 font-light leading-relaxed">
        <p className="text-xs text-muted/40 font-mono">
          Last updated: 2026-05-29
        </p>
        <h2 className="text-base text-foreground font-mono uppercase tracking-wider mt-8">
          1. Terms of Use
        </h2>
        <p>
          By accessing UNCANNY, you agree to participate in this non-invasive human perception experiment. The service is provided as-is for educational and entertainment purposes.
        </p>
        <h2 className="text-base text-foreground font-mono uppercase tracking-wider mt-8">
          2. Intellectual Property &amp; Content
        </h2>
        <p>
          The challenges and visual records rendered within this application consist of curated organic captures and AI-generated synthetic content. Challenge information and source details remain un-indexed to maintain the integrity of daily active observation logs.
        </p>
        <h2 className="text-base text-foreground font-mono uppercase tracking-wider mt-8">
          3. Dynamic Scoring and Streaks
        </h2>
        <p>
          We do not guarantee the preservation of score telemetry. Storage depends entirely on the browser local storage parameters of your device. We are not liable for accidental loss of performance data, streaks, or completion records.
        </p>
      </div>
      <div className="mt-16 border-t border-outline/10 pt-8">
        <a href="/" className="font-mono text-xs uppercase text-muted hover:text-foreground tracking-wider transition-all">
          ← Return to registry
        </a>
      </div>
    </main>
  );
}
