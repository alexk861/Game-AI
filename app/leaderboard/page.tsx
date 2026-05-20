'use client';

import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import Image from 'next/image';
import Link from 'next/link';

interface LeaderboardData {
  total_guesses: number;
  global_failure_rate: number;
  most_misleading: {
    id: string;
    image_url: string;
    failure_rate: number;
    total_guesses: number;
  } | null;
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const failureRateFormatted = data?.global_failure_rate 
    ? (data.global_failure_rate * 100).toFixed(1) + '%' 
    : '--%';

  return (
    <main className="h-[100dvh] overflow-y-auto bg-background text-on-surface selection:bg-primary selection:text-background flex flex-col">
      <TopNav />

      {/* Main Canvas */}
      <div className="relative z-10 flex-grow pt-28 pb-32 px-8 max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
          <div>
            <span className="font-sans text-[9px] font-light uppercase tracking-[0.2em] text-muted/45 mb-2 block">Collective Perception</span>
            <h2 className="font-sans text-2xl md:text-3xl font-light tracking-wide text-foreground leading-none">Observer Registry</h2>
            <div className="mt-4 font-sans text-[9px] font-light text-muted/40">
              * Global observations are live. Participant records are randomized for anonymity.
            </div>
          </div>
          <div className="flex flex-col gap-1.5 md:text-right">
            <div className="font-sans text-[9px] font-light text-muted/45 flex items-center md:justify-end gap-1.5 uppercase tracking-[0.15em]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 living-presence-pulse"></span>
              Live Registry
            </div>
            <div className="font-sans text-[10px] font-light text-foreground/80 uppercase tracking-wider">
              Collective uncertainty: {loading ? '--' : failureRateFormatted}
            </div>
            <div className="font-sans text-[9px] font-light text-muted/45 uppercase tracking-wider">
              Guessed today: {loading ? '--' : data?.total_guesses ?? 0}
            </div>
          </div>
        </section>

        {/* Observer Table (Borderless) */}
        <section className="w-full">
          <div className="grid grid-cols-12 gap-0">
            {/* Table Header */}
            <div className="col-span-12 grid grid-cols-12 py-3 px-4">
              <div className="col-span-2 font-sans text-[9px] font-light uppercase text-muted/40 tracking-widest">INDEX</div>
              <div className="col-span-4 font-sans text-[9px] font-light uppercase text-muted/40 tracking-widest">OBSERVER</div>
              <div className="col-span-3 font-sans text-[9px] font-light uppercase text-muted/40 text-right tracking-widest">ACCURACY</div>
              <div className="col-span-3 font-sans text-[9px] font-light uppercase text-muted/40 text-right tracking-widest">DIVERGENCE</div>
            </div>

            {/* Row 01 */}
            <div className="col-span-12 grid grid-cols-12 py-4 px-4 cursor-default">
              <div className="col-span-2 font-sans text-xs font-light text-muted/40">01</div>
              <div className="col-span-4 font-sans text-sm font-light text-foreground tracking-wide">Observer 3920</div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-muted/80">99.4%</div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-muted/40">Consistent</div>
            </div>

            {/* Row 02 (User Row - Flat and Borderless with Simple Silver Emphasis) */}
            <div className="col-span-12 grid grid-cols-12 py-4 px-4 cursor-default">
              <div className="col-span-2 font-sans text-xs text-foreground font-light">02</div>
              <div className="col-span-4 flex flex-col gap-0.5">
                <div className="font-sans text-sm font-light text-foreground tracking-wide">Observer (You)</div>
                <span className="font-sans text-[9px] font-light text-muted/40 uppercase tracking-wider">active session</span>
              </div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-foreground">--.-%</div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-muted/45">Evaluating</div>
            </div>

            {/* Row 03 */}
            <div className="col-span-12 grid grid-cols-12 py-4 px-4 cursor-default">
              <div className="col-span-2 font-sans text-xs font-light text-muted/40">03</div>
              <div className="col-span-4 font-sans text-sm font-light text-foreground tracking-wide">Observer 4821</div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-muted/80">24.1%</div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-muted/40">Hesitant</div>
            </div>

            {/* Row 04 */}
            <div className="col-span-12 grid grid-cols-12 py-4 px-4 cursor-default">
              <div className="col-span-2 font-sans text-xs font-light text-muted/40">04</div>
              <div className="col-span-4 font-sans text-sm font-light text-foreground tracking-wide">Observer 9120</div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-muted/80">81.2%</div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-muted/40">Mixed</div>
            </div>

            {/* Row 05 */}
            <div className="col-span-12 grid grid-cols-12 py-4 px-4 cursor-default">
              <div className="col-span-2 font-sans text-xs font-light text-muted/40">05</div>
              <div className="col-span-4 font-sans text-sm font-light text-foreground tracking-wide">Observer 1827</div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-muted/80">12.3%</div>
              <div className="col-span-3 font-sans text-xs font-light text-right self-center text-muted/40">Uncertain</div>
            </div>
          </div>
        </section>

        {/* Narrative Visual Section */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="aspect-[16/10] md:aspect-video relative overflow-hidden bg-surface group rounded-[2px]">
            {data?.most_misleading ? (
              <>
                <Image 
                  className="w-full h-full object-cover grayscale opacity-60 group-hover:scale-[1.02] transition-transform duration-[1200ms]" 
                  alt="Most misleading challenge" 
                  src={data.most_misleading.image_url}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-4 right-4 bg-background/90 px-2 py-1 font-sans font-light text-[9px] text-on-surface uppercase border border-outline/10 rounded-[2px]">
                  {(data.most_misleading.failure_rate * 100).toFixed(0)}% uncertainty
                </div>
              </>
            ) : (
              <Image 
                className="w-full h-full object-cover grayscale opacity-40 group-hover:scale-[1.02] transition-transform duration-[1200ms]" 
                alt="Awaiting data" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPRGk9rEkRcqSZP9dpqle6PpCLvtU1j8H69Q5EE_0Pj7Xnh2ZdxUxhnGgo41e9OgCPme3NK3OwzA_tBh52B6hEfJdc9XGadjBudF057FPmyd7pVkGUHWGueCm4YGdg9ieDJHopIDy1qQ0uYoMWQd0r_ZaARlK-BkgjBORohbLubnJ-r0UrnCcwsJZiFag9nTgojx6366p2OvfdyhXzcg-p7ncXsSvIukN_WpDg8aSwEcLgiru9VQegbSYMlNLZFhx2-C-CQcnojbap"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            <div className="absolute bottom-4 left-4 font-sans text-[9px] font-light text-muted/50 tracking-[0.2em] uppercase">Daily divergence hero</div>
          </div>
          
          <div className="flex flex-col justify-center pt-4 md:pt-0 pl-0 md:pl-8">
            <p className="text-sm text-muted/70 mb-6 leading-relaxed max-w-sm font-sans font-light">
              Real photographs often present synthetic characteristics to modern eyes, while generated details capture absolute human trust. Perception remains highly localized.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="min-w-[120px] border border-outline/10 px-5 py-3 text-center font-sans text-xs uppercase tracking-[0.12em] text-muted hover:text-foreground hover:bg-white/2 transition-all rounded-[3px]"
              >
                Return
              </Link>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
