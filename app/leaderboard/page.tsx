'use client';

import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import Image from 'next/image';

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
      {/* Background Layers */}
      <div className="grain-overlay pointer-events-none z-0"></div>
      <div className="scanline-overlay pointer-events-none z-0"></div>

      <TopNav />

      {/* Main Canvas */}
      <div className="relative z-10 flex-grow pt-32 pb-32 px-6 md:px-16 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline pb-6">
          <div>
            <span className="font-mono text-xs text-outline uppercase tracking-[0.2em] mb-2 block">Aggregate results</span>
            <h2 className="font-sans text-3xl md:text-5xl font-bold tracking-tighter uppercase leading-none">TODAY&apos;S RESULTS</h2>
            <div className="mt-4 font-mono text-[10px] text-outline-variant italic">
              * Global metrics are live. Example participant rows are illustrative.
            </div>
          </div>
          <div className="flex flex-col gap-2 md:text-right">
            <div className="font-mono text-xs text-primary flex items-center md:justify-end gap-2 uppercase tracking-widest">
              Live data
            </div>
            <div className="font-mono text-xs text-outline uppercase tracking-wider">
              Overall mistake rate: {loading ? '--' : failureRateFormatted}
            </div>
            <div className="font-mono text-[10px] text-outline-variant uppercase tracking-wider">
              Total guesses today: {loading ? '--' : data?.total_guesses ?? 0}
            </div>
          </div>
        </section>

        {/* Observer Table */}
        <section className="w-full">
          <div className="grid grid-cols-12 gap-0 border-t border-outline">
            {/* Table Header */}
            <div className="col-span-12 grid grid-cols-12 py-4 border-b border-outline bg-surface-container-low px-4">
              <div className="col-span-2 font-mono text-[10px] uppercase text-outline tracking-widest">INDEX</div>
              <div className="col-span-4 font-mono text-[10px] uppercase text-outline tracking-widest">EXAMPLE</div>
              <div className="col-span-3 font-mono text-[10px] uppercase text-outline text-right tracking-widest">ACCURACY</div>
              <div className="col-span-3 font-mono text-[10px] uppercase text-outline text-right tracking-widest">CONFIDENCE</div>
            </div>

            {/* Row 01 */}
            <div className="col-span-12 grid grid-cols-12 py-6 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-2 font-mono text-xs text-outline group-hover:text-background">01</div>
              <div className="col-span-4 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background tracking-tighter">Illustrative row</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">99.4%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-outline">Consistent</div>
            </div>

            {/* Row 02 (User Highlighted) */}
            <div className="col-span-12 grid grid-cols-12 py-8 border-b border-outline-variant bg-surface-container px-4 relative">
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-on-surface"></div>
              <div className="col-span-2 font-mono text-xs text-on-surface font-bold">02</div>
              <div className="col-span-4 flex flex-col gap-1">
                <div className="font-sans text-xl md:text-2xl font-semibold uppercase text-on-surface tracking-tighter">[YOU]</div>
                <span className="font-mono text-[10px] text-outline uppercase tracking-[0.2em]">Just played today...</span>
              </div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-on-surface">--.-%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-outline">Evaluating</div>
            </div>

            {/* Row 03 */}
            <div className="col-span-12 grid grid-cols-12 py-6 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-2 font-mono text-xs text-outline group-hover:text-background">03</div>
              <div className="col-span-4 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background tracking-tighter">Illustrative row</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">24.1%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-outline">Hesitant</div>
            </div>

            {/* Row 04 */}
            <div className="col-span-12 grid grid-cols-12 py-6 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-2 font-mono text-xs text-outline group-hover:text-background">04</div>
              <div className="col-span-4 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background tracking-tighter">Illustrative row</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">81.2%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-outline-variant">Mixed</div>
            </div>

            {/* Row 05 */}
            <div className="col-span-12 grid grid-cols-12 py-6 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-2 font-mono text-xs text-outline group-hover:text-background">05</div>
              <div className="col-span-4 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background tracking-tighter">Illustrative row</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">12.3%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-outline-variant">Uncertain</div>
            </div>
          </div>
        </section>

        {/* Narrative Visual Section */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          <div className="aspect-[16/10] md:aspect-video border border-outline relative overflow-hidden group">
            {data?.most_misleading ? (
              <>
                <Image 
                  className="w-full h-full object-cover grayscale opacity-70 group-hover:scale-105 transition-transform duration-1000" 
                  alt="Most misleading challenge" 
                  src={data.most_misleading.image_url}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-outline/10 mix-blend-overlay"></div>
                <div className="absolute top-4 right-4 bg-background/80 px-2 py-1 font-mono text-[10px] text-on-surface uppercase border border-outline">
                  {(data.most_misleading.failure_rate * 100).toFixed(1)}% FAILURE
                </div>
              </>
            ) : (
              <Image 
                className="w-full h-full object-cover grayscale opacity-50 group-hover:scale-105 transition-transform duration-1000" 
                alt="Awaiting data" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPRGk9rEkRcqSZP9dpqle6PpCLvtU1j8H69Q5EE_0Pj7Xnh2ZdxUxhnGgo41e9OgCPme3NK3OwzA_tBh52B6hEfJdc9XGadjBudF057FPmyd7pVkGUHWGueCm4YGdg9ieDJHopIDy1qQ0uYoMWQd0r_ZaARlK-BkgjBORohbLubnJ-r0UrnCcwsJZiFag9nTgojx6366p2OvfdyhXzcg-p7ncXsSvIukN_WpDg8aSwEcLgiru9VQegbSYMlNLZFhx2-C-CQcnojbap"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            <div className="absolute bottom-4 left-4 font-mono text-[10px] text-primary tracking-[0.2em] uppercase">Today&apos;s most misleading image</div>
          </div>
          
          <div className="flex flex-col justify-center border-l-0 md:border-l border-outline pt-4 md:pt-0 pl-0 md:pl-8">
            <p className="text-base text-on-surface-variant mb-6 leading-relaxed max-w-sm">
              Real photos often look artificial now. Some images fool almost everyone, and faces create false confidence.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="border border-outline px-6 py-3 font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] hover:bg-on-surface hover:text-background transition-colors duration-0">
                Try another set
              </button>
              <button className="border border-outline px-6 py-3 font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] hover:bg-on-surface hover:text-background transition-colors duration-0">
                Review answers
              </button>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
