import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import UncannyLogo from '@/components/UncannyLogo';
import MobileNav from '@/components/landing/MobileNav';
import ScreenshotCarousel from '@/components/landing/ScreenshotCarousel';

export const metadata: Metadata = {
  title: 'UNCANNY — Daily Perception Game',
  description: 'UNCANNY is a daily perception game where you decide whether images are real or AI.',
  openGraph: {
    title: 'UNCANNY — Daily Perception Game',
    description: 'UNCANNY is a daily perception game where you decide whether images are real or AI.',
    images: ['/og-preview.png'],
    type: 'website',
    url: 'https://www.uncanny.info',
  },
  alternates: {
    canonical: '/',
  },
};

export default function HomeLandingPage() {
  const screenshots = [
    {
      src: '/screenshots/ss1.png',
      title: '01. Daily Challenge',
      desc: 'Five images every day.',
    },
    {
      src: '/screenshots/ss2.png',
      title: '02. Look Closer',
      desc: 'Hold to inspect details.',
    },
    {
      src: '/screenshots/ss3.png',
      title: '03. Instant Reveal',
      desc: 'See if your instinct was right.',
    },
    {
      src: '/screenshots/ss4.png',
      title: '04. Crowd Comparison',
      desc: 'Compare your guess with other players.',
    },
    {
      src: '/screenshots/ss5.png',
      title: '05. Extra Rounds',
      desc: 'Continue with optional extra images.',
    },
  ];

  return (
    <main className="min-h-[100dvh] bg-background text-foreground relative font-sans scroll-smooth overflow-x-hidden pb-16">
      {/* Schema.org JSON-LD structured data for superior AEO/SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "UNCANNY",
            "operatingSystem": "Android, Web Browser",
            "applicationCategory": "GameApplication",
            "description": "UNCANNY is a daily game where you decide whether images are real or AI.",
            "genre": "Puzzle, Trivia",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />

      {/* Subtle, restrained gold background glow (Max opacity 0.04) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.04),rgba(255,255,255,0))] pointer-events-none" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.01]" />

      {/* ── Navigation ── */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-16 py-4 bg-background/95 backdrop-blur-md border-b border-outline/10 shadow-lg">
        <Link href="/" className="flex items-center gap-3 group">
          <UncannyLogo size={24} className="text-accent-amber group-hover:scale-105 transition-transform" />
          <span className="text-xl md:text-2xl font-bold tracking-[0.15em] text-foreground">UNCANNY</span>
        </Link>
        <MobileNav />
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-36 pb-16 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Simple live indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-accent-amber/20 mb-8">
          <span className="flex h-1.5 w-1.5 rounded-full bg-accent-amber" />
          <span className="font-sans text-[10px] uppercase tracking-wider text-muted font-bold">Today&apos;s challenge is live</span>
        </div>

        {/* Clear, human mixed-case headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-foreground max-w-3xl">
          Can you tell real from AI?
        </h1>
        
        {/* High-conversion target sentence */}
        <p className="mt-6 text-sm md:text-base text-accent-amber font-sans font-bold max-w-xl">
          UNCANNY is a daily game where you decide whether images are real or AI.
        </p>

        <div className="mt-6 text-lg sm:text-xl md:text-2xl max-w-2xl text-muted font-light leading-relaxed space-y-1">
          <p>Five images.</p>
          <p>Twelve seconds each.</p>
          <p>A new challenge every day.</p>
        </div>

        {/* Dynamic CTAs - Restrained with no glowing or pulsing animations */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center items-center">
          <Link
            href="/game"
            className="w-full sm:w-auto bg-accent-amber hover:bg-accent-amber/90 text-background font-bold py-4 px-8 text-center text-sm tracking-wider transition-all rounded-[3px] shadow-xl hover:scale-[1.01] active:scale-[0.98]"
            style={{ color: 'var(--bg)' }}
          >
            Play Now
          </Link>
          <a
            href="/uncanny-debug.apk"
            download="uncanny-debug.apk"
            className="w-full sm:w-auto bg-surface hover:bg-surface-container border border-outline/10 text-foreground py-4 px-8 text-center text-sm font-semibold tracking-wider transition-all rounded-[3px] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
            style={{ borderColor: 'var(--outline)', color: 'var(--text)' }}
          >
            <span>Download Android App</span>
            <span className="text-[10px] text-accent-amber font-mono">(26.6 MB)</span>
          </a>
        </div>
        
        <p className="mt-4 text-xs text-muted/60 font-sans">
          No account needed.
        </p>
      </section>

      {/* ── Split Card Swipe Graphics (Non-face scenes only) ── */}
      <section className="pb-20 px-6 max-w-2xl mx-auto">
        <div className="relative aspect-[16/10] w-full rounded-[4px] overflow-hidden border border-outline/15 bg-surface shadow-2xl flex items-center justify-center">
          {/* Subtle grid backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--outline-variant)_1px,transparent_1px),linear-gradient(to_bottom,var(--outline-variant)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />

          {/* Left half: AI generated scene (no faces) */}
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-surface-container-lowest/95 border-r-2 border-accent-amber/50">
            <div className="absolute top-4 left-4 bg-wrong/20 border border-wrong/40 px-2.5 py-1 rounded-[3px] text-[9px] font-sans text-wrong uppercase tracking-wider font-bold">
              AI
            </div>
            {/* Image Split Left */}
            <div className="w-[200%] h-full relative opacity-60 grayscale brightness-75">
              <Image src="/test-pollinations.jpg" alt="AI Generated Environment Scene" fill className="object-cover" />
            </div>
          </div>

          {/* Right half: Real Photography scene (no faces) */}
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden bg-background/95">
            <div className="absolute top-4 right-4 bg-correct/20 border border-correct/40 px-2.5 py-1 rounded-[3px] text-[9px] font-sans text-correct uppercase tracking-wider font-bold">
              Real
            </div>
            {/* Image Split Right */}
            <div className="w-[200%] h-full relative right-full opacity-90">
              <Image src="/test-pollinations.jpg" alt="Real Photographic Environment Capture" fill className="object-cover" />
            </div>
          </div>

          {/* Swipe Indicator Handle */}
          <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-accent-amber text-background px-4 py-2 font-sans text-xs uppercase font-extrabold tracking-widest rounded-full shadow-2xl flex items-center gap-1.5 border-2 border-foreground">
              <span>◀</span>
              <span>Swipe to decide</span>
              <span>▶</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works (4 Simple, restrained, readable cards) ── */}
      <section id="how-it-works" className="py-20 bg-surface-container-low/40 border-y border-outline/10 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-foreground mb-12 uppercase tracking-wide">
            How It Works
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {/* Card 1 */}
            <div className="p-6 bg-surface border border-outline/10 rounded-[4px] flex flex-col items-center text-center shadow-lg hover:border-accent-amber/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-center mb-6">
                <span className="text-accent-amber font-bold text-lg">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">1. Look</h3>
              <p className="text-xs text-muted leading-relaxed font-light">
                Study the image.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-surface border border-outline/10 rounded-[4px] flex flex-col items-center text-center shadow-lg hover:border-accent-amber/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-center mb-6">
                <span className="text-accent-amber font-bold text-lg">↔️</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">2. Decide</h3>
              <p className="text-xs text-muted leading-relaxed font-light">
                Choose Real or AI.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-surface border border-outline/10 rounded-[4px] flex flex-col items-center text-center shadow-lg hover:border-accent-amber/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-center mb-6">
                <span className="text-accent-amber font-bold text-lg">📊</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">3. Compare</h3>
              <p className="text-xs text-muted leading-relaxed font-light">
                See how other players answered.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 bg-surface border border-outline/10 rounded-[4px] flex flex-col items-center text-center shadow-lg hover:border-accent-amber/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-center mb-6">
                <span className="text-accent-amber font-bold text-lg">📅</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">4. Return Tomorrow</h3>
              <p className="text-xs text-muted leading-relaxed font-light">
                A new set arrives every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Daily Streak Loop ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6 uppercase tracking-wide">
          Play in Under 2 Minutes
        </h2>
        <p className="text-sm md:text-base text-muted max-w-xl mx-auto leading-relaxed font-light mb-12">
          Keep it short, simple, and daily. Test your eye against the daily set, protect your streak, and see how you stack up globally.
        </p>

        {/* Micro Streak Counter UI */}
        <div className="bg-surface border border-outline/10 rounded-[4px] max-w-sm mx-auto shadow-xl flex items-center justify-between p-6">
          <div className="text-left">
            <span className="block font-sans text-[10px] uppercase tracking-wider text-accent-amber font-bold">Daily Streak</span>
            <span className="text-2xl font-black text-foreground mt-1 block">5 DAYS ACTIVE</span>
          </div>
          <div className="text-4xl">
            🔥
          </div>
        </div>

        {/* Wordle-style 5 boxes */}
        <div className="flex justify-center gap-3 mt-10">
          <div className="w-10 h-10 border-2 border-correct bg-correct/15 text-correct font-bold rounded-[4px] flex items-center justify-center">☑</div>
          <div className="w-10 h-10 border-2 border-correct bg-correct/15 text-correct font-bold rounded-[4px] flex items-center justify-center">☑</div>
          <div className="w-10 h-10 border-2 border-wrong bg-wrong/15 text-wrong font-bold rounded-[4px] flex items-center justify-center">☒</div>
          <div className="w-10 h-10 border-2 border-correct bg-correct/15 text-correct font-bold rounded-[4px] flex items-center justify-center">☑</div>
          <div className="w-10 h-10 border-2 border-outline/20 bg-transparent text-muted font-bold rounded-[4px] flex items-center justify-center">5</div>
        </div>
      </section>

      {/* ── Screenshots ── */}
      <section className="py-20 border-t border-outline/10 bg-surface-container-low/20 px-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-12 text-center uppercase tracking-wide">
          See the game
        </h2>

        <ScreenshotCarousel screenshots={screenshots} />
      </section>

      {/* ── Simple Elegant Footer ── */}
      <footer className="py-12 bg-surface-container-lowest border-t border-outline/10 px-6 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-3">
              <UncannyLogo size={20} className="text-accent-amber" />
              <span className="font-sans uppercase tracking-[0.25em] text-foreground font-bold">UNCANNY</span>
            </div>
            <p className="text-[10px] text-muted/60 font-sans mt-1">Daily Perception Test</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 font-sans text-[10px] uppercase tracking-wider text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-all">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-all">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-all">Contact</Link>
            <Link href="/google-play" className="hover:text-foreground transition-all">Google Play Info</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
