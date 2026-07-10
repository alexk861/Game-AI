import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import UncannyLogo from '@/components/UncannyLogo';

export const metadata: Metadata = {
  title: 'UNCANNY — Google Play Submission',
  description: 'Official Google Play submission information for UNCANNY, a daily perception game about real and AI-generated images.',
  openGraph: {
    title: 'UNCANNY — Google Play Submission',
    description: 'Official Google Play submission information for UNCANNY, a daily perception game about real and AI-generated images.',
    images: [
      {
        url: '/test-pollinations.jpg',
        width: 1024,
        height: 500,
        alt: 'UNCANNY Feature Graphic',
      },
    ],
  },
  alternates: {
    canonical: '/google-play',
  },
};

export default function GooglePlayPage() {
  const screenshots = [
    { src: '/screenshots/ss1.png', label: '01. Daily Challenge' },
    { src: '/screenshots/ss2.png', label: '02. Zoom & Inspect' },
    { src: '/screenshots/ss3.png', label: '03. Curated Verdicts' },
    { src: '/screenshots/ss4.png', label: '04. Player Consensus' },
    { src: '/screenshots/ss5.png', label: '05. Extra Bonus Images' },
  ];

  return (
    <main className="min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-background text-foreground relative font-sans scroll-smooth pb-20">
      {/* Schema.org JSON-LD for AEO / SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "UNCANNY",
            "operatingSystem": "Android, Web Browser",
            "applicationCategory": "GameApplication",
            "description": "UNCANNY is a daily visual perception game where players decide whether images are real photographs or AI-generated images.",
            "genre": "Puzzle, Trivia",
            "offers": {
               "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />

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

      {/* ── Page Hero ── */}
      <section className="relative pt-40 pb-12 px-6 max-w-4xl mx-auto text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-8 border-b border-outline/10 pb-12">
          {/* Mock App Icon */}
          <div className="flex justify-center md:justify-start">
            <div className="relative w-28 h-28 rounded-[8px] overflow-hidden border border-outline/20 bg-surface shadow-2xl">
              <Image 
                src="/icon.png" 
                alt="UNCANNY App Icon" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-accent-amber mb-2">
              // Google Play Submission Portal
            </div>
            <h2 className="text-4xl font-light tracking-wide text-foreground uppercase mb-2">
              UNCANNY
            </h2>
            <p className="text-sm font-mono uppercase tracking-wider text-muted">
              Daily Perception Test
            </p>
            <p className="mt-4 text-sm text-muted max-w-xl font-light leading-relaxed">
              Official developer resources, privacy summaries, legal disclosures, and active store assets prepared for the Google Play Console verification team.
            </p>
          </div>
        </div>
      </section>

      {/* ── Product Overview ── */}
      <section className="py-6 px-6 max-w-4xl mx-auto">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Main Info Column (Span 2) */}
          <div className="md:col-span-2 space-y-10">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted/70 border-b border-outline/10 pb-2 mb-4">
                Short Description
              </h3>
              <p className="text-sm font-light leading-relaxed text-foreground">
                UNCANNY is a daily visual perception game where players decide whether images are real photographs or AI-generated images.
              </p>
            </div>

            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted/70 border-b border-outline/10 pb-2 mb-4">
                What Makes UNCANNY Different?
              </h3>
              <ul className="space-y-3 text-xs font-light text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-accent-amber font-mono mt-0.5">•</span>
                  <span><strong>No account required:</strong> Jump straight into the challenge with zero onboarding friction.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-amber font-mono mt-0.5">•</span>
                  <span><strong>Daily challenges:</strong> A fresh set of five curated images arrives every day.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-amber font-mono mt-0.5">•</span>
                  <span><strong>Real vs AI images:</strong> Test your perception against cutting-edge generative AI.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-amber font-mono mt-0.5">•</span>
                  <span><strong>Community comparison:</strong> Instantly compare your answers with global players.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-amber font-mono mt-0.5">•</span>
                  <span><strong>Optional bonus images:</strong> Extra sets available for those who want to go deeper.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-amber font-mono mt-0.5">•</span>
                  <span><strong>Fast 2-minute sessions:</strong> Designed for quick, satisfying cognitive breaks.</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted/70 border-b border-outline/10 pb-2 mb-4">
                Gameplay Summary
              </h3>
              <div className="space-y-3 text-xs text-muted leading-relaxed font-light">
                <p>
                  Each day, players are presented with a new set of five images. Some are real photographs; others are AI-generated.
                </p>
                <p>
                  Players inspect each image under time pressure, utilizing a long-press magnification gesture to zoom into fine textures, lighting tells, and patterns. After studying the details, they swipe or tap to categorize the image as "Real" or "AI".
                </p>
                <p>
                  Once a decision is made, players receive immediate educational feedback detailing the visual tells, along with photographer credits. Scores are then compiled to show how their perception scales against the global average.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted/70 border-b border-outline/10 pb-2 mb-4">
                Data & Privacy Summary
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="p-4 bg-surface/50 border border-outline/5 rounded-[3px]">
                  <h4 className="font-mono text-[10px] uppercase text-accent-amber mb-1.5">// ANONYMOUS PLAY</h4>
                  <p className="text-muted font-light leading-relaxed">
                    No player accounts, registration, or sign-ins are required. Basic gameplay operates with absolute anonymity.
                  </p>
                </div>
                <div className="p-4 bg-surface/50 border border-outline/5 rounded-[3px]">
                  <h4 className="font-mono text-[10px] uppercase text-accent-amber mb-1.5">// LOCAL DATA ONLY</h4>
                  <p className="text-muted font-light leading-relaxed">
                    Streaks, recent scores, and daily progress are saved directly inside local secure storage on the player&apos;s device.
                  </p>
                </div>
                <div className="p-4 bg-surface/50 border border-outline/5 rounded-[3px]">
                  <h4 className="font-mono text-[10px] uppercase text-accent-amber mb-1.5">// PRIVACY SCOPED ANALYTICS</h4>
                  <p className="text-muted font-light leading-relaxed">
                    General geographical and device metrics are collected strictly to optimize app stability and consensus metrics.
                  </p>
                </div>
                <div className="p-4 bg-surface/50 border border-outline/5 rounded-[3px]">
                  <h4 className="font-mono text-[10px] uppercase text-accent-amber mb-1.5">// ZERO DATA SALE</h4>
                  <p className="text-muted font-light leading-relaxed">
                    We strictly enforce a policy where no answers or player data are ever packaged, sold, or shared with third-party companies.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted/70 border-b border-outline/10 pb-2 mb-4">
                Ads & Content Rating Disclosures
              </h3>
              <div className="space-y-4 text-xs text-muted leading-relaxed font-light">
                <p>
                  <strong>Ads Disclosure:</strong> UNCANNY may use rewarded ads only when a player voluntarily requests additional bonus images. Ads are not required to complete the daily challenge.
                </p>
                <p>
                  <strong>Content Rating Note:</strong> The app contains image-based puzzle gameplay and contains no explicit adult content. Rated PEGI 3 / Everyone.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Specifications Sidebar */}
          <div className="space-y-6">
            <div className="p-6 bg-surface border border-outline/5 rounded-[3px]">
              <h4 className="font-mono text-[10px] uppercase text-accent-amber tracking-wider mb-4">// APP SPECIFICATIONS</h4>
              <div className="space-y-4 font-mono text-[10px] text-muted uppercase">
                <div className="flex justify-between border-b border-outline/5 pb-2">
                  <span>Product ID:</span>
                  <span className="text-foreground">info.uncanny.app</span>
                </div>
                <div className="flex justify-between border-b border-outline/5 pb-2">
                  <span>Support Contact:</span>
                  <a href="mailto:support@uncanny.info" className="text-accent-amber hover:underline lowercase">support@uncanny.info</a>
                </div>
                <div className="flex justify-between border-b border-outline/5 pb-2">
                  <span>Category:</span>
                  <span className="text-foreground">Visual Puzzle / Trivia</span>
                </div>
                <div className="flex justify-between border-b border-outline/5 pb-2">
                  <span>Content Rating:</span>
                  <span className="text-foreground">Everyone / PEGI 3</span>
                </div>
                <div className="flex justify-between border-b border-outline/5 pb-2">
                  <span>Ads Format:</span>
                  <span className="text-foreground">Rewarded Ads (Optional)</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-2">
                <Link 
                  href="/privacy" 
                  className="w-full text-center font-mono text-[10px] uppercase py-2.5 bg-background border border-outline/15 hover:border-foreground tracking-wider transition-all rounded-[3px]"
                >
                  PRIVACY POLICY
                </Link>
                <Link 
                  href="/terms" 
                  className="w-full text-center font-mono text-[10px] uppercase py-2.5 bg-background border border-outline/15 hover:border-foreground tracking-wider transition-all rounded-[3px]"
                >
                  TERMS & CONDITIONS
                </Link>
                <Link 
                  href="/contact" 
                  className="w-full text-center font-mono text-[10px] uppercase py-2.5 bg-background border border-outline/15 hover:border-foreground tracking-wider transition-all rounded-[3px]"
                >
                  SUPPORT DIRECTORY
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Graphical Assets Showcase ── */}
      <section className="py-12 border-t border-outline/5 px-6 max-w-4xl mx-auto">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted/70 border-b border-outline/10 pb-3 mb-8">
          // STORE GRAPHICAL ASSETS
        </h3>

        <div className="grid gap-8">
          {/* Feature Graphic */}
          <div className="bg-surface/50 border border-outline/5 p-6 rounded-[3px]">
            <h4 className="font-mono text-[10px] uppercase text-accent-amber tracking-wider mb-4">// FEATURE GRAPHIC (1024 x 500)</h4>
            <div className="relative aspect-[1024/500] w-full max-w-2xl overflow-hidden rounded-[4px] border border-outline/10 bg-surface shadow-2xl">
              <Image 
                src="/test-pollinations.jpg" 
                alt="UNCANNY Feature Graphic"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          </div>

          {/* Screenshots Grid */}
          <div className="bg-surface/50 border border-outline/5 p-6 rounded-[3px]">
            <h4 className="font-mono text-[10px] uppercase text-accent-amber tracking-wider mb-6">// PHONE SCREENSHOTS (5 CURATED LAYOUTS)</h4>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {screenshots.map((ss, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="relative aspect-[9/16] w-full max-w-[150px] overflow-hidden rounded-[4px] border border-outline/10 bg-surface shadow-lg">
                    <Image 
                      src={ss.src} 
                      alt={ss.label}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </div>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-muted mt-3">{ss.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-outline/10 bg-surface-container-lowest text-muted px-6 text-center text-xs mt-20">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <UncannyLogo size={20} className="text-accent-amber" />
            <span className="font-mono uppercase tracking-[0.2em] text-foreground">UNCANNY © 2026</span>
          </div>
          <div className="flex gap-6 font-mono text-[10px] uppercase tracking-wider">
            <Link href="/" className="hover:text-foreground transition-all">Home</Link>
            <Link href="/game" className="hover:text-foreground transition-all">Play</Link>
            <Link href="/contact" className="hover:text-foreground transition-all">Contact</Link>
            <Link href="/privacy" className="hover:text-foreground transition-all">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-all">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
