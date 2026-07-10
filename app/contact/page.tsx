import { Metadata } from 'next';
import Link from 'next/link';
import UncannyLogo from '@/components/UncannyLogo';

export const metadata: Metadata = {
  title: 'Contact Support — UNCANNY',
  description: 'Official support and contact information for UNCANNY, a daily perception game.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-background text-foreground relative font-sans scroll-smooth flex flex-col justify-between">
      {/* Noise overlay */}
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.015]" />

      {/* ── Top Header Navigation ── */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-16 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 bg-background/90 backdrop-blur-md border-b border-outline/10">
        <Link href="/" className="flex items-center gap-3 group">
          <UncannyLogo size={24} className="text-accent-amber group-hover:scale-105 transition-transform" />
          <h1 className="text-xl md:text-2xl font-bold tracking-[0.2em] leading-none text-foreground">UNCANNY</h1>
        </Link>
        <Link 
          href="/game" 
          className="font-mono text-[10px] md:text-xs uppercase px-4 py-2 border border-outline/20 hover:border-foreground hover:bg-foreground hover:text-background tracking-[0.12em] transition-all rounded-[3px]"
          style={{ borderColor: 'var(--outline)', color: 'var(--text)' }}
        >
          Play Challenge
        </Link>
      </header>

      {/* ── Contact Section ── */}
      <section className="flex-grow pt-48 pb-20 px-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-surface border border-outline/10 rounded-[4px] p-8 md:p-10 shadow-2xl relative">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-accent-amber mb-6 text-center">
            // Support Directory
          </div>
          
          <div className="flex flex-col items-center text-center">
            {/* Elegant Envelope Icon */}
            <div className="p-4 bg-background rounded-full border border-outline/5 text-accent-amber mb-6 shadow-md">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-light tracking-wide text-foreground uppercase mb-3">
              Get in Touch
            </h2>
            <p className="text-xs text-muted font-light leading-relaxed mb-8 max-w-xs">
              Have questions, feedback, or need assistance with the UNCANNY app? Our support team is here to help.
            </p>
            
            {/* Primary Contact Card */}
            <div className="w-full bg-background border border-outline/5 rounded-[3px] py-4 px-6 mb-8 group hover:border-accent-amber/40 transition-all duration-300">
              <span className="block font-mono text-[9px] text-muted/40 uppercase tracking-widest mb-1">// EMAIL SUPPORT</span>
              <a 
                href="mailto:support@uncanny.info" 
                className="text-lg font-mono tracking-wide text-accent-amber hover:text-foreground transition-all"
              >
                support@uncanny.info
              </a>
            </div>

            <p className="text-[10px] text-muted/60 font-light leading-normal max-w-xs">
              We typically respond to all support queries within 24–48 business hours.
            </p>
          </div>

          <div className="mt-8 border-t border-outline/10 pt-6 flex justify-center gap-4 text-[10px] font-mono uppercase tracking-wider text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-all">Privacy</Link>
            <span className="text-outline/20">|</span>
            <Link href="/terms" className="hover:text-foreground transition-all">Terms</Link>
            <span className="text-outline/20">|</span>
            <Link href="/google-play" className="hover:text-foreground transition-all">Google Play</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-outline/10 bg-surface-container-lowest text-muted px-6 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <UncannyLogo size={20} className="text-accent-amber" />
            <span className="font-mono uppercase tracking-[0.2em] text-foreground font-bold">UNCANNY © 2026</span>
          </div>
          <div className="flex gap-6 font-mono text-[10px] uppercase tracking-wider">
            <Link href="/" className="hover:text-foreground transition-all">Home</Link>
            <Link href="/game" className="hover:text-foreground transition-all">Play</Link>
            <Link href="/privacy" className="hover:text-foreground transition-all">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-all">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
