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
      "You frequently pause on symmetrical features. Organic textures seem to cause hesitation.",
      "Your confidence drops in low-light scenarios. You show a high baseline of suspicion.",
      "Pattern-seeking behavior detected. You often second-guess natural noise.",
      "You trust lighting too quickly. Most of your errors happen in the first two seconds."
    ];
    const tags = [
      ["Hesitant", "Symmetry-focused", "Pattern-seeking"],
      ["High-suspicion", "Organic-hesitant", "Fatigue-prone"],
      ["Lighting-biased", "Confidence-drop", "Surface-trusting"]
    ];
    const randIndex = Math.floor(Math.random() * observations.length);
    const tagIndex = Math.floor(Math.random() * tags.length);
    return { text: observations[randIndex], tags: tags[tagIndex] };
  }, []);

  // Return a loading state or nothing while mounting to avoid hydration mismatch
  if (!mounted) return <main className="min-h-[100dvh] bg-background" />;

  const hasPlayed = stats && stats.totalSetsPlayed > 0;
  const driftRate = stats && stats.totalSetsPlayed > 0 
    ? ((1 - (stats.totalCorrect / (stats.totalSetsPlayed * 5))) * 100).toFixed(0) 
    : '0';

  return (
    <main className="min-h-[100dvh] bg-background text-on-surface selection:bg-on-surface selection:text-background flex flex-col">
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
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline pb-6">
            <div>
              <p className="font-mono text-xs text-outline mb-2">CLINICAL ASSESSMENT</p>
              <h2 className="font-sans text-3xl md:text-5xl font-bold uppercase tracking-tighter">PERCEPTION RECORD</h2>
            </div>
            <div className="font-mono text-xs text-outline flex gap-4">
              <span>ACTIVE PARTICIPANT</span>
              <span className="text-primary animate-pulse">ACTIVE SIGNAL</span>
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
            <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-px bg-outline">
              <div className="bg-background py-10 px-8 flex flex-col justify-between">
                <p className="font-mono text-xs text-outline uppercase mb-12">DRIFT RATE</p>
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-sans text-5xl md:text-6xl font-bold">{driftRate}%</span>
                    <span className="material-symbols-outlined text-error text-sm">trending_up</span>
                  </div>
                  <p className="text-sm text-outline-variant">Deviation from objective consensus across {stats?.totalSetsPlayed} recorded sessions.</p>
                </div>
              </div>
              <div className="bg-background py-10 px-8 flex flex-col justify-between">
                <p className="font-mono text-xs text-outline uppercase mb-12">CALIBRATION STREAK</p>
                <div>
                  <div className="font-sans text-5xl md:text-6xl font-bold uppercase mb-4">{stats?.currentStreak} DAYS</div>
                  <div className="h-1 w-full bg-surface-container mt-auto">
                    <div className="h-full bg-on-surface w-3/4"></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Behavioral Profile */}
            <section className="mb-12">
              <div className="border border-outline py-8 px-8 md:px-12 relative overflow-hidden">
                <div className="absolute inset-0 scanline-overlay opacity-30 pointer-events-none"></div>
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  <h3 className="font-sans text-2xl font-bold uppercase tracking-tight">BEHAVIORAL PROFILE</h3>
                </div>
                <div className="space-y-6 relative z-10">
                  <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant italic">
                    &quot;{profileObservation.text}&quot;
                  </p>
                  <div className="pt-6 border-t border-outline-variant flex flex-wrap gap-4">
                    {profileObservation.tags.map(tag => (
                      <span key={tag} className="px-4 py-1 border border-outline-variant font-mono text-[10px] uppercase text-outline">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Recent Logs */}
            <section>
              <div className="flex items-center justify-between border-b border-outline pb-4 mb-4">
                <h3 className="font-mono text-xs text-outline uppercase">TODAY&apos;S OBSERVATION LOGS</h3>
                <span className="font-mono text-[10px] text-outline-variant">RECORDS: {stats?.todayResults.length ?? 0}</span>
              </div>
              {stats?.todayResults && stats.todayResults.length > 0 ? (
                <div className="divide-y divide-outline-variant">
                  {stats.todayResults.map((res, i) => (
                    <div key={res.challengeId} className="py-6 flex items-center justify-between group hover:px-4 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center gap-8">
                        <span className="font-mono text-xs text-outline">0{i+1}</span>
                        <div className="flex flex-col">
                          <span className="font-sans text-sm md:text-base font-semibold uppercase tracking-widest">CASE {res.challengeId.slice(0, 4)}</span>
                          <span className="font-mono text-[10px] text-outline uppercase">GUESS: {res.guess} / REAL: {res.answer ?? '??'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <span className={`font-mono text-xs ${res.correct ? 'text-primary' : 'text-error'}`}>
                          {res.correct ? 'VERIFIED' : 'FAILED'}
                        </span>
                        <span className="material-symbols-outlined text-outline group-hover:text-on-surface">chevron_right</span>
                      </div>
                    </div>
                  ))}
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
