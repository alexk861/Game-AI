import { Metadata } from 'next';
import Link from 'next/link';
import UncannyLogo from '@/components/UncannyLogo';

export const metadata: Metadata = {
  title: 'Terms of Service — UNCANNY',
  description: 'Official Terms of Service for UNCANNY, outlining user agreements, intellectual property guidelines, and scoring streak parameters.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-background text-foreground px-8 py-16 max-w-2xl mx-auto relative font-sans">
      <div className="noise-overlay" />
      <div className="flex items-center justify-between border-b border-outline/10 pb-4 mb-8">
        <Link href="/" className="flex items-center gap-3 group">
          <UncannyLogo size={24} className="text-accent-amber group-hover:scale-105 transition-transform" />
          <span className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-foreground">UNCANNY</span>
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/50">
          Terms of Service
        </span>
      </div>
      <h1 className="text-3xl font-sans font-light tracking-wide mb-8 text-foreground">
        TERMS OF SERVICE
      </h1>
      <div className="space-y-6 text-sm text-muted font-light leading-relaxed">
        <p className="text-xs text-muted/40 font-mono">
          Last updated: 2026-05-30
        </p>
        <h2 className="text-base text-foreground font-mono uppercase tracking-wider mt-8">
          1. Terms of Use
        </h2>
        <p>
          By accessing UNCANNY, you agree to participate in this daily perception game. The service is provided as-is for educational and entertainment purposes.
        </p>
        <h2 className="text-base text-foreground font-mono uppercase tracking-wider mt-8">
          2. Intellectual Property &amp; Content
        </h2>
        <p>
          The challenges and images rendered within this application consist of curated real photographs and AI-generated images. Challenge information and source details remain un-indexed to maintain the integrity of daily sets.
        </p>
        <h2 className="text-base text-foreground font-mono uppercase tracking-wider mt-8">
          3. Dynamic Scoring and Streaks
        </h2>
        <p>
          We do not guarantee the permanent preservation of score data. Storage depends entirely on the browser local storage parameters of your device. We are not liable for accidental loss of gameplay data, streaks, or standings.
        </p>
      </div>
      <div className="mt-16 border-t border-outline/10 pt-8">
        <Link href="/" className="font-mono text-xs uppercase text-muted hover:text-foreground tracking-wider transition-all">
          ← Return to Home
        </Link>
      </div>
    </main>
  );
}
