'use client';

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-background text-foreground px-8 py-16 max-w-2xl mx-auto relative">
      <div className="noise-overlay" />
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/50 mb-8">
        classification: public / privacy policy
      </div>
      <h1 className="text-3xl font-sans font-light tracking-wide mb-8">
        PRIVACY POLICY
      </h1>
      <div className="space-y-6 text-sm text-muted/80 font-light leading-relaxed">
        <p className="text-xs text-muted/40 font-mono">
          Last updated: 2026-05-29
        </p>
        <h2 className="text-base text-foreground font-mono uppercase tracking-wider mt-8">
          1. Data Collection and Scoping
        </h2>
        <p>
          UNCANNY operates as a localized, non-invasive digital perception experiment. We do not gather personally identifiable information (PII) without your direct authorization.
        </p>
        <p>
          We log anonymous interaction statistics, including accuracy rates, response times, and daily streak counts. This telemetry is stored inside your browser&apos;s local storage and used solely to establish global consensus averages.
        </p>
        <h2 className="text-base text-foreground font-mono uppercase tracking-wider mt-8">
          2. Analytics &amp; Advertising Operations
        </h2>
        <p>
          This website utilizes Google Analytics 4 (GA4) and Google H5 Games Ads to optimize user experience and fund server maintenance. These utilities use dynamic cookies to track general geography, browser client types, and ad delivery performance.
        </p>
        <p>
          You may consult Google&apos;s Privacy &amp; Terms page to opt-out of behavioral profiling and manage cookie preferences.
        </p>
        <h2 className="text-base text-foreground font-mono uppercase tracking-wider mt-8">
          3. Dynamic Browser Storage
        </h2>
        <p>
          Telemetry relating to active perception set runs, streaks, and performance indices is preserved on your client device via standard browser local storage parameters. Clearing your browser data will delete these logs permanently.
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
