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

const HOW_IT_WORKS = [
  { icon: 'search', title: '1. Look', desc: 'Study the image.' },
  { icon: 'swipe', title: '2. Decide', desc: 'Choose Real or AI.' },
  { icon: 'groups', title: '3. Compare', desc: 'See how other players answered.' },
  { icon: 'calendar_today', title: '4. Return Tomorrow', desc: 'A new set arrives every day.' },
];

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

      {/* Subtle, restrained unstable-red pressure at the top (max opacity 0.04) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(160,64,64,0.04),rgba(255,255,255,0))] pointer-events-none" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.01]" />

      {/* ── Navigation ── */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-16 py-4 bg-background/95 backdrop-blur-md border-b border-border-dim">
        <Link href="/" className="flex items-center gap-3 group">
          <UncannyLogo size={24} className="text-foreground group-hover:opacity-80 transition-opacity" />
          <span className="text-xl md:text-2xl font-bold tracking-label text-foreground">UNCANNY</span>
        </Link>
        <MobileNav />
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-36 pb-16 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Live indicator — quiet archival chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface border border-border-dim mb-8">
          <span className="flex h-1.5 w-1.5 bg-wrong animate-pulse" />
          <span className="font-mono text-label uppercase tracking-label text-muted">Today&apos;s challenge is live</span>
        </div>

        {/* Clear, human mixed-case headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.05] text-foreground max-w-3xl">
          Can you tell real from <span className="text-wrong">AI</span>?
        </h1>

        {/* High-conversion target sentence */}
        <p className="mt-6 text-sm md:text-base text-foreground/95 font-sans font-normal max-w-xl">
          UNCANNY is a daily game where you decide whether images are real or AI.
        </p>

        <div className="mt-6 font-mono text-label-lg uppercase tracking-label max-w-2xl text-muted space-y-1.5">
          <p>Five images · Twelve seconds each</p>
          <p>A new challenge every day</p>
        </div>

        {/* CTAs — one dominant action, one quiet secondary */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center items-center">
          <Link
            href="/game"
            className="w-full sm:w-auto min-h-14 flex items-center justify-center whitespace-nowrap bg-primary text-background font-mono font-medium py-4 px-10 text-center text-label-lg uppercase tracking-caps transition-all hover:bg-primary/90 active:bg-primary/90 active:scale-[0.985]"
          >
            Play Now
          </Link>
          <a
            href="/uncanny-debug.apk"
            download="uncanny-debug.apk"
            className="w-full sm:w-auto min-h-14 bg-transparent border border-outline/60 hover:border-outline active:border-outline text-foreground py-4 px-6 text-center font-mono text-label-lg uppercase tracking-caps transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.985]"
          >
            <span>Download Android App</span>
            <span className="text-label text-muted">(16 MB)</span>
          </a>
        </div>

        <p className="mt-4 font-mono text-label uppercase tracking-label text-muted/60">
          No account needed.
        </p>
      </section>

      {/* ── Split Card Swipe Graphics (Non-face scenes only) ── */}
      <section className="pb-20 px-6 max-w-2xl mx-auto">
        <div className="relative aspect-[16/10] w-full overflow-hidden border border-border-dim bg-surface flex items-center justify-center">
          {/* Subtle grid backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--outline-variant)_1px,transparent_1px),linear-gradient(to_bottom,var(--outline-variant)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />

          {/* Left half: AI generated scene (no faces) */}
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-surface-container-lowest/95 border-r border-border-dim">
            <div className="absolute top-4 left-4 z-10 bg-background/70 border border-wrong px-2.5 py-1 font-mono text-label text-wrong uppercase tracking-label font-bold">
              AI
            </div>
            {/* Image Split Left */}
            <div className="w-[200%] h-full relative opacity-60 grayscale brightness-75">
              <Image src="/test-pollinations.jpg" alt="AI Generated Environment Scene" fill className="object-cover" />
            </div>
          </div>

          {/* Right half: Real Photography scene (no faces) */}
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden bg-background/95">
            <div className="absolute top-4 right-4 z-10 bg-background/70 border border-real px-2.5 py-1 font-mono text-label text-real uppercase tracking-label font-bold">
              Real
            </div>
            {/* Image Split Right */}
            <div className="w-[200%] h-full relative right-full opacity-90">
              <Image src="/test-pollinations.jpg" alt="Real Photographic Environment Capture" fill className="object-cover" />
            </div>
          </div>

          {/* Swipe Indicator Handle */}
          <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-primary text-background px-4 py-2 font-mono text-label uppercase font-bold tracking-label flex items-center gap-2">
              <span className="material-symbols-outlined text-sm leading-none" aria-hidden="true">swipe</span>
              <span>Swipe to decide</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works (4 restrained archival panels) ── */}
      <section id="how-it-works" className="py-20 bg-surface/40 border-y border-border-dim px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-3 font-mono text-label uppercase tracking-kicker text-muted/70">
            // The Ritual
          </div>
          <h2 className="text-2xl md:text-3xl font-light text-center text-foreground mb-12 uppercase tracking-label">
            How It Works
          </h2>

          <div className="grid gap-px sm:grid-cols-2 md:grid-cols-4 bg-border-dim border border-border-dim">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.title} className="p-6 bg-surface flex flex-col items-center text-center">
                <div className="w-12 h-12 border border-border-dim flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-foreground/90" style={{ fontVariationSettings: "'wght' 200" }} aria-hidden="true">
                    {step.icon}
                  </span>
                </div>
                <h3 className="font-mono text-label-lg uppercase tracking-caps font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-xs text-muted leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Daily Streak Loop ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-light text-foreground mb-6 uppercase tracking-label">
          Play in Under 2 Minutes
        </h2>
        <p className="text-sm md:text-base text-muted max-w-xl mx-auto leading-relaxed font-light mb-12">
          Keep it short, simple, and daily. Test your eye against the daily set, protect your streak, and see how you stack up globally.
        </p>

        {/* Micro Streak Counter UI — mirrors the in-game streak squares */}
        <div className="bg-surface border border-border-dim max-w-sm mx-auto flex items-center justify-between p-6">
          <div className="text-left">
            <span className="block font-mono text-label uppercase tracking-label text-muted">Daily Streak</span>
            <span className="text-2xl font-light text-foreground mt-1 block">5 DAYS ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="block h-2 w-2 bg-outline" />
            ))}
          </div>
        </div>

        {/* Wordle-style result marks — same glyphs as the in-game share block */}
        <div className="flex justify-center gap-3 mt-10 font-mono text-xl" aria-label="Example daily result: three correct, one wrong, one remaining">
          <div className="w-10 h-10 border border-real text-real flex items-center justify-center">▣</div>
          <div className="w-10 h-10 border border-real text-real flex items-center justify-center">▣</div>
          <div className="w-10 h-10 border border-wrong text-wrong flex items-center justify-center">☒</div>
          <div className="w-10 h-10 border border-real text-real flex items-center justify-center">▣</div>
          <div className="w-10 h-10 border border-border-dim text-muted flex items-center justify-center text-sm">5</div>
        </div>
      </section>

      {/* ── Screenshots ── */}
      <section className="py-20 border-t border-border-dim bg-surface/20 px-6">
        <h2 className="text-2xl md:text-3xl font-light text-foreground mb-12 text-center uppercase tracking-label">
          See the game
        </h2>

        <ScreenshotCarousel screenshots={screenshots} />
      </section>

      {/* ── Simple Elegant Footer ── */}
      <footer className="py-12 bg-surface-container-lowest border-t border-border-dim px-6 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-3">
              <UncannyLogo size={20} className="text-foreground" />
              <span className="font-mono uppercase tracking-kicker text-foreground font-bold">UNCANNY</span>
            </div>
            <p className="font-mono text-label text-muted/60 mt-1 uppercase tracking-label">Daily Perception Test</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 font-mono text-label uppercase tracking-label text-muted">
            <Link href="/privacy" className="hover:text-foreground active:text-foreground transition-all">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground active:text-foreground transition-all">Terms</Link>
            <Link href="/contact" className="hover:text-foreground active:text-foreground transition-all">Contact</Link>
            <Link href="/google-play" className="hover:text-foreground active:text-foreground transition-all">Google Play Info</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
