'use client';

import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';
import { initTodaySession } from '@/lib/storage';
import { UncannyStorage } from '@/lib/types';
import { TIMER_DURATION_SECONDS } from '@/lib/gameConfig';

export default function Profile() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<UncannyStorage | null>(null);
  const [profileObservation, setProfileObservation] = useState({ text: "" });

  useEffect(() => {
    const timer = setTimeout(() => {
      const sessionStats = initTodaySession();
      setStats(sessionStats);
      
      let tendencyText = "Insufficient data to establish behavioral tendencies.";
      if (sessionStats.todayResults && sessionStats.todayResults.length > 0) {
        const correctCount = sessionStats.todayResults.filter(r => r.correct).length;
        const total = sessionStats.todayResults.length;
        const avgTimeRemaining = sessionStats.todayResults.reduce((sum, r) => sum + r.timeRemaining, 0) / total;
        const avgResponseTime = TIMER_DURATION_SECONDS - avgTimeRemaining;
        
        let speedAnalysis = "";
        if (avgResponseTime <= 5) speedAnalysis = "You made quick, instinctive decisions. ";
        else if (avgResponseTime <= 10) speedAnalysis = "You took measured time before deciding. ";
        else speedAnalysis = "You hesitated and scrutinized details before deciding. ";
        
        let accuracyAnalysis = "";
        if (correctCount === total) accuracyAnalysis = "You read every image correctly today.";
        else if (correctCount > total / 2) accuracyAnalysis = "You successfully distinguished most subjects.";
        else accuracyAnalysis = "The synthetic imagery frequently deceived you today.";

        tendencyText = speedAnalysis + accuracyAnalysis;
      }
      
      setProfileObservation({ text: tendencyText });
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Return a loading state or nothing while mounting to avoid hydration mismatch
  if (!mounted) return <main className="min-h-[100dvh] bg-background" />;

  const hasPlayed = stats && stats.totalSetsPlayed > 0;
  const driftRate = stats && stats.totalSetsPlayed > 0 
    ? ((1 - (stats.totalCorrect / (stats.totalSetsPlayed * 5))) * 100).toFixed(0) 
    : '0';

  return (
    <main className="h-[100dvh] overflow-y-auto bg-background text-on-surface selection:bg-on-surface selection:text-background flex flex-col">
      {/* Background Visual */}
      <div 
        className="fixed inset-0 z-0 opacity-12 filter grayscale contrast-125 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(31, 33, 38, 0.3) 0%, rgba(31, 33, 38, 1) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBxH5D61Vgh3_nZmzO3bxlVJL2_CIfWIvG4WnOyhkXTIOIEP8gukoefTVVgFDbWU6glJY9Ra6L55bYHyxF8u3dsBDGhaRYUmolZsQDzJIAosU5PPLqqBKn62U2WoloGfjkZwcfqZuo4G4Lu9gQf-GdsZj72cxiOG10D2ihLAtCGuyHlN_sXqPVXu80qezR4-EBl9pR5IOg8U7bo8BnvMXhJHWQjn8pODrFCAOPfGcbMc8b2s5QfUCTJpyLi9XPo4hlVvW2WxbkVhmbI")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>

      <TopNav />

      <div className="relative z-10 pt-28 pb-32 px-8 max-w-3xl mx-auto w-full">
        {/* Profile Header */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4">
            <div>
              <p className="font-sans text-[9px] font-light uppercase tracking-[0.2em] text-muted/45 mb-2">Session History</p>
              <h2 className="font-sans text-2xl md:text-3xl font-light tracking-wide text-foreground">Observer Profile</h2>
            </div>
            <div className="font-sans text-[9px] font-light tracking-wider text-muted/40 flex gap-4">
              <span>UPDATED AFTER TODAY&apos;S CHALLENGE</span>
            </div>
          </div>
        </section>

        {!hasPlayed ? (
          <section className="mb-20 flex flex-col items-center justify-center text-center p-12">
            <span className="material-symbols-outlined text-outline/30 text-3xl mb-3">person_off</span>
            <p className="font-sans text-[9px] font-light text-muted/45 uppercase tracking-[0.2em] mb-1">NO COMPLETED SETS YET</p>
            <p className="text-muted/30 text-xs font-sans font-light">Complete today&apos;s set to create your record.</p>
          </section>
        ) : (
          <>
            {/* Section 1: Perception Stats (Borderless) */}
            <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="flex flex-col justify-between">
                <p className="font-sans text-[9px] font-light uppercase tracking-[0.2em] text-muted/45 mb-3">CONSENSUS DRIFT</p>
                <div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-sans text-4xl font-light text-foreground">{driftRate}%</span>
                  </div>
                  <p className="text-xs font-sans font-light text-muted/50 leading-relaxed">Disagreement with collective daily observations.</p>
                </div>
              </div>
              <div className="flex flex-col justify-between">
                <p className="font-sans text-[9px] font-light uppercase tracking-[0.2em] text-muted/45 mb-3">OBSERVATION SEQUENCE</p>
                <div>
                  <div className="font-sans text-4xl font-light text-foreground mb-2">{stats?.currentStreak} Days</div>
                  <p className="text-xs font-sans font-light text-muted/50 leading-relaxed">Consecutive days of active perception testing.</p>
                </div>
              </div>
            </section>

            {/* Section 2: Behavioral Profile */}
            <section className="mb-10">
              <div className="py-2">
                <h3 className="font-sans text-[9px] font-light uppercase tracking-[0.2em] text-muted/45 mb-3">BEHAVIORAL TENDENCY</h3>
                <p className="text-lg md:text-xl leading-relaxed text-foreground font-sans font-light max-w-xl">
                  {profileObservation.text}
                </p>
              </div>
            </section>

            {/* Section 4: Recent Logs (Borderless Editorial Text Rows) */}
            <section className="mt-8">
              <div className="flex items-center justify-between pb-3 mb-4">
                <h3 className="font-sans text-[9px] font-light uppercase tracking-[0.2em] text-muted/45">RECENT OBSERVATIONS</h3>
                <span className="font-sans text-[9px] font-light text-muted/40">RECORDS: {stats?.todayResults.length ?? 0}</span>
              </div>
              {stats?.todayResults && stats.todayResults.length > 0 ? (
                <div className="space-y-4">
                  {stats.todayResults.map((res, i) => {
                    const recordTitle = `Image ${String(i + 1).padStart(2, '0')}`;
                    const secondaryNote = res.reasoningTag 
                      ? `Noted: ${res.reasoningTag.toLowerCase()}` 
                      : `Chose ${res.guess} • source: ${res.answer ?? 'unverified'}`;
                      
                    const responseTime = TIMER_DURATION_SECONDS - res.timeRemaining;
                    const resultText = res.correct 
                      ? (responseTime <= 5 ? "Quick & correct" : "Calculated & correct")
                      : (responseTime <= 5 ? "Rushed & incorrect" : "Fooled despite scrutiny");
                    
                    return (
                      <div key={res.challengeId} className="py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-sans text-[10px] font-light text-muted/40">0{i+1}</span>
                          <div className="flex flex-col">
                            <span className="font-sans text-sm font-light text-foreground tracking-wide">{recordTitle}</span>
                            <span className="font-sans text-[9px] font-light text-muted/45 uppercase tracking-wider mt-0.5">
                              {secondaryNote}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-right ml-4">
                          <span className={`font-sans text-[9px] font-light uppercase tracking-wider ${res.correct ? 'text-foreground/80' : 'text-muted/35'}`}>
                            {resultText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted/30 font-sans text-[9px] font-light uppercase tracking-[0.15em]">
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
