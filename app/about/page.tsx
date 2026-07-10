import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import UncannyLogo from '@/components/UncannyLogo';
import ScreenshotCarousel from '@/components/landing/ScreenshotCarousel';

export const metadata: Metadata = {
  title: 'About UNCANNY — Daily Perception Game',
  description: 'Learn about UNCANNY, the daily perception game where you tell real photos from AI-generated images.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLandingPage() {
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
    <main className="min-h-[100dvh] bg-[#0f172a] text-[#f8fafc] relative font-sans scroll-smooth overflow-x-hidden pb-16">
      {/* Subtle premium background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))]" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.01]" />

      {/* ── Navigation ── */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-16 py-4 bg-[#0f172a]/95 backdrop-blur-md border-b border-[#1e293b] shadow-lg">
        <Link href="/" className="flex items-center gap-3 group">
          <UncannyLogo size={24} className="text-[#f59e0b] group-hover:scale-105 transition-transform" />
          <span className="text-xl md:text-2xl font-bold tracking-[0.15em] text-[#f8fafc]">UNCANNY</span>
        </Link>
        <Link 
          href="/game" 
          className="text-xs uppercase px-5 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-[#0f172a] font-bold tracking-wider rounded-[4px] transition-all shadow-md hover:scale-[1.03] active:scale-[0.98]"
        >
          Play Now
        </Link>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-36 pb-16 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Simple live indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e293b] border border-[#f59e0b]/20 mb-8">
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
          <span className="font-sans text-[10px] uppercase tracking-wider text-[#abb1bd] font-bold">Today&apos;s challenge is live</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-foreground uppercase max-w-3xl">
          Can you tell <span className="bg-gradient-to-r from-[#f59e0b] via-[#f97316] to-[#ef4444] bg-clip-text text-transparent">real from AI</span>?
        </h1>
        
        <div className="mt-8 text-lg sm:text-xl md:text-2xl max-w-2xl text-[#abb1bd] font-light leading-relaxed space-y-1">
          <p>Five images.</p>
          <p>Twelve seconds each.</p>
          <p>A new challenge every day.</p>
        </div>

        {/* Dynamic CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center items-center">
          <Link
            href="/game"
            className="w-full sm:w-auto bg-[#f59e0b] hover:bg-[#d97706] text-[#0f172a] font-bold py-4 px-8 text-center text-sm tracking-wider transition-all rounded-[6px] shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Play Now
          </Link>
          <a
            href="/uncanny-debug.apk"
            download="uncanny-debug.apk"
            className="w-full sm:w-auto bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#f8fafc] py-4 px-8 text-center text-sm font-semibold tracking-wider transition-all rounded-[6px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Download Android App</span>
            <span className="text-[10px] text-[#f59e0b] font-mono">(26.6 MB)</span>
          </a>
        </div>
        
        <p className="mt-4 text-xs text-[#abb1bd]/60 font-sans">
          No account needed.
        </p>
      </section>

      {/* ── Split Card Swipe Graphics ── */}
      <section className="pb-20 px-6 max-w-2xl mx-auto">
        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-[#334155] bg-[#1e293b] shadow-2xl flex items-center justify-center">
          {/* Subtle grid backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />

          {/* Left half: AI generated */}
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-[#1b1c21]/95 border-r-2 border-[#f59e0b]/50">
            <div className="absolute top-4 left-4 bg-[#ef4444]/20 border border-[#ef4444]/40 px-2.5 py-1 rounded text-[9px] font-sans text-[#ef4444] uppercase tracking-wider font-bold">
              ☒ AI GENERATED
            </div>
            <div className="absolute bottom-4 left-4 font-sans text-[10px] text-[#abb1bd] leading-tight select-none opacity-50">
              Spot the pixel flaws and AI anomalies.
            </div>
            {/* Image Split Left */}
            <div className="w-[200%] h-full relative opacity-60 grayscale brightness-75">
              <Image src="/screenshots/ss2.png" alt="AI Side" fill className="object-cover" />
            </div>
          </div>

          {/* Right half: Real Photography */}
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden bg-[#1f2126]/95">
            <div className="absolute top-4 right-4 bg-[#10b981]/20 border border-[#10b981]/40 px-2.5 py-1 rounded text-[9px] font-sans text-[#10b981] uppercase tracking-wider font-bold">
              ☑ REAL PHOTO
            </div>
            <div className="absolute bottom-4 right-4 font-sans text-[10px] text-[#abb1bd] leading-tight select-none opacity-50 text-right">
              Real texture, depth, and lighting.
            </div>
            {/* Image Split Right */}
            <div className="w-[200%] h-full relative right-full opacity-90">
              <Image src="/screenshots/ss2.png" alt="Real Side" fill className="object-cover" />
            </div>
          </div>

          {/* Swipe Indicator Handle */}
          <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-[#f59e0b] text-[#0f172a] px-4 py-2 font-sans text-xs uppercase font-extrabold tracking-widest rounded-full shadow-2xl flex items-center gap-1.5 border-2 border-[#f8fafc]">
              <span>◀</span>
              <span>SWIPE TO DECIDE</span>
              <span>▶</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works (4 Simple Steps) ── */}
      <section className="py-20 bg-[#1e293b]/40 border-y border-[#334155] px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[#f8fafc] mb-12 uppercase tracking-wide">
            How It Works
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {/* Step 1 */}
            <div className="p-6 bg-[#1e293b]/70 border border-[#334155] rounded-xl flex flex-col items-center text-center shadow-lg hover:border-[#f59e0b]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/35 flex items-center justify-center mb-6">
                <span className="text-[#f59e0b] font-bold text-lg">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-[#f8fafc] mb-2">1. Look</h3>
              <p className="text-xs text-[#abb1bd] leading-relaxed font-light">
                Study the image.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-[#1e293b]/70 border border-[#334155] rounded-xl flex flex-col items-center text-center shadow-lg hover:border-[#f59e0b]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/35 flex items-center justify-center mb-6">
                <span className="text-[#f59e0b] font-bold text-lg">↔️</span>
              </div>
              <h3 className="text-lg font-bold text-[#f8fafc] mb-2">2. Decide</h3>
              <p className="text-xs text-[#abb1bd] leading-relaxed font-light">
                Choose Real or AI.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-[#1e293b]/70 border border-[#334155] rounded-xl flex flex-col items-center text-center shadow-lg hover:border-[#f59e0b]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/35 flex items-center justify-center mb-6">
                <span className="text-[#f59e0b] font-bold text-lg">📊</span>
              </div>
              <h3 className="text-lg font-bold text-[#f8fafc] mb-2">3. Compare</h3>
              <p className="text-xs text-[#abb1bd] leading-relaxed font-light">
                See how other players answered.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-[#1e293b]/70 border border-[#334155] rounded-xl flex flex-col items-center text-center shadow-lg hover:border-[#f59e0b]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/35 flex items-center justify-center mb-6">
                <span className="text-[#f59e0b] font-bold text-lg">📅</span>
              </div>
              <h3 className="text-lg font-bold text-[#f8fafc] mb-2">4. Return Tomorrow</h3>
              <p className="text-xs text-[#abb1bd] leading-relaxed font-light">
                A new set arrives every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Daily Streak Loop ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#f8fafc] mb-6 uppercase tracking-wide">
          Play in Under 2 Minutes
        </h2>
        <p className="text-sm md:text-base text-[#abb1bd] max-w-xl mx-auto leading-relaxed font-light mb-12">
          Keep it short, simple, and daily. Test your eye against the daily set, protect your streak, and see how you stack up globally.
        </p>

        {/* Micro Streak Counter UI */}
        <div className="bg-[#1e293b]/80 border border-[#334155] p-6 rounded-xl max-w-sm mx-auto shadow-xl flex items-center justify-between">
          <div className="text-left">
            <span className="block font-sans text-[10px] uppercase tracking-wider text-[#f59e0b] font-bold">Daily Streak</span>
            <span className="text-2xl font-black text-[#f8fafc] mt-1 block">5 DAYS ACTIVE</span>
          </div>
          <div className="text-4xl">
            🔥
          </div>
        </div>

        {/* Wordle-style 5 boxes */}
        <div className="flex justify-center gap-3 mt-10">
          <div className="w-10 h-10 border-2 border-[#10b981] bg-[#10b981]/15 text-[#10b981] font-bold rounded-lg flex items-center justify-center">☑</div>
          <div className="w-10 h-10 border-2 border-[#10b981] bg-[#10b981]/15 text-[#10b981] font-bold rounded-lg flex items-center justify-center">☑</div>
          <div className="w-10 h-10 border-2 border-[#ef4444] bg-[#ef4444]/15 text-[#ef4444] font-bold rounded-lg flex items-center justify-center">☒</div>
          <div className="w-10 h-10 border-2 border-[#10b981] bg-[#10b981]/15 text-[#10b981] font-bold rounded-lg flex items-center justify-center">☑</div>
          <div className="w-10 h-10 border-2 border-[#334155] bg-transparent text-[#abb1bd] font-bold rounded-lg flex items-center justify-center">5</div>
        </div>
      </section>

      {/* ── Screenshots ── */}
      <section className="py-20 border-t border-[#334155] bg-[#1e293b]/20 px-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#f8fafc] mb-12 text-center uppercase tracking-wide">
          See the game
        </h2>

        <ScreenshotCarousel screenshots={screenshots} />
      </section>

      {/* ── Simple Elegant Footer ── */}
      <footer className="py-12 bg-[#0a0f1d] border-t border-[#334155] px-6 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-3">
              <UncannyLogo size={20} className="text-[#f59e0b]" />
              <span className="font-sans uppercase tracking-[0.25em] text-[#f8fafc] font-bold">UNCANNY</span>
            </div>
            <p className="text-[10px] text-[#abb1bd]/60 font-sans mt-1">Daily Perception Test</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 font-sans text-[10px] uppercase tracking-wider text-[#abb1bd]">
            <Link href="/privacy" className="hover:text-[#f8fafc] transition-all">Privacy</Link>
            <Link href="/terms" className="hover:text-[#f8fafc] transition-all">Terms</Link>
            <Link href="/contact" className="hover:text-[#f8fafc] transition-all">Contact</Link>
            <Link href="/google-play" className="hover:text-[#f8fafc] transition-all">Google Play Info</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
