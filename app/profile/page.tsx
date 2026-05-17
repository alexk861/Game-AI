'use client';

import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import { useMemo, useEffect, useState } from 'react';
import { initTodaySession } from '@/lib/storage';
import { UncannyStorage } from '@/lib/types';

export default function Profile() {
  const [stats, setStats] = useState<UncannyStorage | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStats(initTodaySession());
    setMounted(true);
  }, []);

  const profileObservation = useMemo(() => {
    const observations = [
      "You slow down on faces. You hesitated longer on realistic textures.",
      "You trust natural lighting. Symmetrical images fooled you more often.",
      "You were more accurate after the third image. Artificial skin textures stood out to you.",
      "You noticed details others missed. Symmetrical images fooled you more often."
    ];
    return { text: observations[Math.floor(Math.random() * observations.length)] };
  }, []);

  // Return a loading state or nothing while mounting to avoid hydration mismatch
  if (!mounted) return <main className="min-h-[100dvh] bg-background" />;

  const hasPlayed = stats && stats.totalSetsPlayed > 0;
  const driftRate = stats && stats.totalSetsPlayed > 0 
    ? ((1 - (stats.totalCorrect / (stats.totalSetsPlayed * 5))) * 100).toFixed(0) 
    : '0';

  return (
    <main className="h-[100dvh] overflow-y-auto bg-background text-on-surface selection:bg-on-surface selection:text-background flex flex-col">
      <div className="grain-overlay"></div>
      
      {/* Background Visual */}
      <div 
        className="fixed inset-0 z-0 opacity-20 filter grayscale contrast-150 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(19, 19, 19, 0) 0%, rgba(19, 19, 19, 1) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBxH5D61Vgh3_nZmzO3bxlVJL2_CIfWIvG4WnOyhkXTIOIEP8gukoefTVVgFDbWU6glJY9Ra6L55bYHyxF8u3dsBDGhaRYUmolZsQDzJIAosU5PPLqqBKn62U2WoloGfjkZwcfqZuo4G4Lu9gQf-GdsZj72cxiOG10D2ihLAtCGuyHlN_sXqPVXu80qezR4-EBl9pR5IOg8U7bo8BnvMXhJHWQjn8pODrFCAOPfGcbMc8b2s5QfUCTJpyLi9XPo4hlVvW2WxbkVhmbI")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>

      <TopNav />

      <div className="relative z-10 pt-32 pb-40 px-6 md:px-16 max-w-4xl mx-auto w-full">
        {/* Profile Header */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline pb-6">
            <div>
              <p className="font-mono text-xs text-outline mb-2 uppercase">Session history</p>
              <h2 className="font-sans text-3xl md:text-5xl font-bold uppercase tracking-tighter">YOUR PERCEPTION RECORD</h2>
            </div>
            <div className="font-mono text-xs text-outline flex gap-4">
              <span>UPDATED AFTER TODAY'S CHALLENGE</span>
            </div>
          </div>
        </section>

        {!hasPlayed ? (
          <section className="mb-20 flex flex-col items-center justify-center text-center border border-outline border-dashed p-16">
            <span className="material-symbols-outlined text-outline-variant text-5xl mb-4">person_off</span>
            <p className="font-mono text-sm text-outline uppercase tracking-widest mb-2">NO COMPLETED SETS YET</p>
            <p className="text-outline-variant max-w-sm">Complete today&apos;s set to create your observer record and begin calibration.</p>
          </section>
        ) : (
          <>
            {/* Section 1: Perception Stats */}
            <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-px bg-outline">
              <div className="bg-background py-8 px-6 flex flex-col justify-between">
                <p className="font-mono text-xs text-outline uppercase mb-8">CONSENSUS DIFFERENCE</p>
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-sans text-5xl md:text-6xl font-bold">{driftRate}%</span>
                  </div>
                  <p className="text-sm text-outline-variant">You disagreed with the majority more often today.</p>
                </div>
              </div>
              <div className="bg-background py-8 px-6 flex flex-col justify-between">
                <p className="font-mono text-xs text-outline uppercase mb-8">CONSECUTIVE SESSIONS</p>
                <div>
                  <div className="font-sans text-5xl md:text-6xl font-bold uppercase mb-4">{stats?.currentStreak} DAYS</div>
                  <div className="h-1 w-full bg-surface-container mt-auto">
                    <div className="h-full bg-on-surface w-3/4"></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Behavioral Profile */}
            <section className="mb-8">
              <div className="border border-outline py-6 px-6 md:px-8 relative overflow-hidden">
                <div className="absolute inset-0 scanline-overlay opacity-30 pointer-events-none"></div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <h3 className="font-mono text-xs text-outline uppercase">YOUR TENDENCIES</h3>
                </div>
                <div className="space-y-6 relative z-10">
                  <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant italic">
                    &quot;{profileObservation.text}&quot;
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Recent Logs */}
            <section>
              <div className="flex items-center justify-between border-b border-outline pb-4 mb-4">
                <h3 className="font-mono text-xs text-outline uppercase">RECENT OBSERVATIONS</h3>
                <span className="font-mono text-[10px] text-outline-variant">RECORDS: {stats?.todayResults.length ?? 0}</span>
              </div>
              {stats?.todayResults && stats.todayResults.length > 0 ? (
                <div className="divide-y divide-outline-variant">
                  {stats.todayResults.map((res, i) => {
                    const titleOpts = ["Mountain sunset", "Apartment mirror", "Kitchen portrait", "Airport window", "Winter street", "Subway platform", "Surveillance hallway"];
                    const fakeTitle = titleOpts[i % titleOpts.length];
                    const resultText = res.correct 
                      ? (["You got this right", "Your instinct was correct", "You noticed the details", "You trusted this correctly"][i%4]) 
                      : (["This one fooled you", "Most people believed this too", "You trusted the lighting", "You doubted a real photograph"][i%4]);
                    
                    return (
                      <div key={res.challengeId} className="py-4 md:py-6 flex items-center justify-between group hover:px-2 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-4 md:gap-8">
                          <span className="font-mono text-xs text-outline">0{i+1}</span>
                          <div className="flex flex-col">
                            <span className="font-sans text-sm md:text-base font-semibold uppercase tracking-widest">{fakeTitle}</span>
                            <span className="font-mono text-[10px] text-outline uppercase mt-1">
                              You chose {res.guess} • It was {res.answer ?? '??'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-right ml-4 max-w-[120px] md:max-w-none">
                          <span className={`font-mono text-[9px] md:text-[10px] uppercase ${res.correct ? 'text-primary' : 'text-outline-variant'}`}>
                            {resultText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-outline-variant font-mono text-xs uppercase">
                  No records from today.
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
