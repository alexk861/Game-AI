'use client';

import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';

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
    <main className="min-h-[100dvh] bg-background text-on-surface selection:bg-primary selection:text-background flex flex-col">
      {/* Background Layers */}
      <div className="grain-overlay pointer-events-none z-0"></div>
      <div className="scanline-overlay pointer-events-none z-0"></div>

      <TopNav />

      {/* Main Canvas */}
      <div className="relative z-10 flex-grow pt-32 pb-32 px-6 md:px-16 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <section className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8 border-l border-outline pl-8">
          <div>
            <span className="font-mono text-xs text-outline uppercase tracking-[0.2em] mb-2 block">System // Registry</span>
            <h2 className="font-sans text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-none">OBSERVER_INDEX</h2>
            <div className="mt-4 font-mono text-[10px] text-outline-variant italic">
              * MVP Simulation based on global aggregate data
            </div>
          </div>
          <div className="flex flex-col gap-2 md:text-right">
            <div className="font-mono text-xs text-primary flex items-center md:justify-end gap-2">
              <span className="w-2 h-2 bg-primary animate-pulse"></span>
              DAILY ARCHIVE STATUS: {loading ? 'SYNCING...' : 'SYNCED'}
            </div>
            <div className="font-mono text-xs text-outline">
              GLOBAL CONSENSUS FAILURE RATE: {loading ? '--' : failureRateFormatted}
            </div>
            <div className="font-mono text-[10px] text-outline-variant">
              TOTAL ACTIONS RECORDED: {loading ? '--' : data?.total_guesses ?? 0}
            </div>
          </div>
        </section>

        {/* Observer Table */}
        <section className="w-full">
          <div className="grid grid-cols-12 gap-0 border-t border-outline">
            {/* Table Header */}
            <div className="col-span-12 grid grid-cols-12 py-6 border-b border-outline bg-surface-container-low px-4">
              <div className="col-span-2 font-mono text-[10px] uppercase text-outline tracking-widest">INDEX</div>
              <div className="col-span-4 font-mono text-[10px] uppercase text-outline tracking-widest">IDENTITY</div>
              <div className="col-span-3 font-mono text-[10px] uppercase text-outline text-right tracking-widest">DRIFT</div>
              <div className="col-span-3 font-mono text-[10px] uppercase text-outline text-right tracking-widest">STABILITY</div>
            </div>

            {/* Row 01 */}
            <div className="col-span-12 grid grid-cols-12 py-8 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-2 font-mono text-xs text-outline group-hover:text-background">0x0A1</div>
              <div className="col-span-4 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background tracking-tighter">OBS_001</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">0.002%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-outline">OPTIMAL</div>
            </div>

            {/* Row 02 (User Highlighted) */}
            <div className="col-span-12 grid grid-cols-12 py-10 border-b-2 border-outline-variant bg-surface-container px-4 relative">
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-on-surface"></div>
              <div className="col-span-2 font-mono text-xs text-on-surface font-bold">0x0A2</div>
              <div className="col-span-4 flex flex-col gap-1">
                <div className="font-sans text-xl md:text-2xl font-semibold uppercase text-on-surface tracking-tighter">OBS_094 [YOU]</div>
                <span className="font-mono text-[10px] text-outline uppercase tracking-[0.2em]">Calibration in progress...</span>
              </div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-on-surface">0.142%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-outline">NOMINAL</div>
            </div>

            {/* Row 03 (Corrupted) */}
            <div className="col-span-12 grid grid-cols-12 py-8 border-b border-outline px-4 bg-error/5 relative overflow-hidden group">
              <div className="absolute inset-0 scanline-overlay opacity-50 mix-blend-overlay"></div>
              <div className="col-span-2 font-mono text-xs text-error/60 line-through decoration-error/40 relative z-10">0x0A3</div>
              <div className="col-span-4 font-sans text-xl md:text-2xl font-semibold uppercase text-error/80 tracking-tighter relative z-10">OBS_119C</div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-error/60 relative z-10">ERR_NaN</div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-error font-bold tracking-widest animate-pulse relative z-10">SIGNAL LOST</div>
            </div>

            {/* Row 04 */}
            <div className="col-span-12 grid grid-cols-12 py-8 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-2 font-mono text-xs text-outline group-hover:text-background">0x0A4</div>
              <div className="col-span-4 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background tracking-tighter">OBS_212</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">4.921%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-outline-variant">DEGRADED</div>
            </div>

            {/* Row 05 (Redacted) */}
            <div className="col-span-12 grid grid-cols-12 py-8 border-b border-outline px-4 cursor-default">
              <div className="col-span-2 font-mono text-xs text-outline-variant">0x0A5</div>
              <div className="col-span-4 font-sans text-xl md:text-2xl font-semibold uppercase text-outline-variant tracking-tighter opacity-40">OBS_REDACTED</div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-outline-variant">--.---%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-outline-variant tracking-widest bg-outline-variant text-transparent select-none w-fit ml-auto">REDACTED</div>
            </div>
          </div>
        </section>

        {/* Narrative Visual Section */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="aspect-video border border-outline relative overflow-hidden group">
            {data?.most_misleading ? (
              <>
                <img 
                  className="w-full h-full object-cover grayscale opacity-50 group-hover:scale-105 transition-transform duration-1000" 
                  alt="Most misleading challenge" 
                  src={data.most_misleading.image_url}
                />
                <div className="absolute inset-0 bg-error/10 mix-blend-overlay"></div>
                <div className="absolute top-4 right-4 bg-background/80 px-2 py-1 font-mono text-[10px] text-error uppercase border border-error/50">
                  {(data.most_misleading.failure_rate * 100).toFixed(1)}% FAILURE
                </div>
              </>
            ) : (
              <img 
                className="w-full h-full object-cover grayscale opacity-50 group-hover:scale-105 transition-transform duration-1000" 
                alt="Satellite network array floating in deep space" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPRGk9rEkRcqSZP9dpqle6PpCLvtU1j8H69Q5EE_0Pj7Xnh2ZdxUxhnGgo41e9OgCPme3NK3OwzA_tBh52B6hEfJdc9XGadjBudF057FPmyd7pVkGUHWGueCm4YGdg9ieDJHopIDy1qQ0uYoMWQd0r_ZaARlK-BkgjBORohbLubnJ-r0UrnCcwsJZiFag9nTgojx6366p2OvfdyhXzcg-p7ncXsSvIukN_WpDg8aSwEcLgiru9VQegbSYMlNLZFhx2-C-CQcnojbap"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            <div className="absolute bottom-4 left-4 font-mono text-[10px] text-primary tracking-[0.2em] uppercase">Visual Cluster // Node 04</div>
          </div>
          
          <div className="flex flex-col justify-center border-l border-outline pl-8">
            <p className="text-base text-outline mb-6 leading-relaxed">
              Participation in the UNCANNY collective requires absolute synchronization. Any drift exceeding 5.0% results in immediate index redaction. Stability is monitored via subcutaneous drift-markers. 
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="border border-outline px-8 py-3 font-mono text-xs uppercase tracking-[0.1em] hover:bg-on-surface hover:text-background transition-colors duration-0">
                RECALIBRATE
              </button>
              <button className="border border-outline px-8 py-3 font-mono text-xs uppercase tracking-[0.1em] hover:bg-on-surface hover:text-background transition-colors duration-0">
                VIEW_LOGS
              </button>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
