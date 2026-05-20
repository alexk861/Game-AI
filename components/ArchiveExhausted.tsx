'use client';

import { useState, useEffect, useCallback } from 'react';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import Link from 'next/link';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import CalmAdTransitionOverlay from './CalmAdTransitionOverlay';

interface ArchiveExhaustedProps {
  onUnlockExtraPlay?: () => void;
  onRequestReflection?: () => void;
  adAlreadyUnlocked?: boolean;
  reflectionLevel?: number;
  lastReflectionUnlockAt?: string | null;
}

export default function ArchiveExhausted({
  onUnlockExtraPlay,
  onRequestReflection,
  adAlreadyUnlocked = false,
  reflectionLevel = 0,
  lastReflectionUnlockAt = null,
}: ArchiveExhaustedProps) {
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [adWatched, setAdWatched] = useState(false);

  const handleExtraPlayReward = useCallback(() => {
    setAdWatched(true);
    if (onUnlockExtraPlay) onUnlockExtraPlay();
  }, [onUnlockExtraPlay]);

  const { triggerAd: triggerExtraPlayAd, adPlaying, showOverlay, overlayPhase } = useRewardedAd(handleExtraPlayReward);

  const handleWatchAndReplay = useCallback(() => {
    triggerExtraPlayAd();
  }, [triggerExtraPlayAd]);

  useEffect(() => {
    if (!lastReflectionUnlockAt) {
      setCooldownRemaining(0);
      return;
    }
    const checkCooldown = () => {
      const elapsed = Date.now() - new Date(lastReflectionUnlockAt).getTime();
      const remaining = Math.max(0, Math.ceil((20000 - elapsed) / 1000));
      setCooldownRemaining(remaining);
      return remaining;
    };

    const remaining = checkCooldown();
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      const rem = checkCooldown();
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [lastReflectionUnlockAt]);

  return (
    <main className="h-[100dvh] overflow-y-auto bg-background text-on-surface selection:bg-on-surface selection:text-background flex flex-col">
      <TopNav />
      
      <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 md:px-16 pt-28 pb-36">
        {/* Central Empty State Module */}
        <section className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
          <div className="font-sans text-[9px] font-light uppercase tracking-[0.2em] text-muted/40 mb-10">
            Daily Archive
          </div>
          
          <h1 className="font-sans text-2xl md:text-3xl font-light tracking-wide text-foreground mb-6">
            All images reviewed.
          </h1>
          
          <p className="text-sm text-muted/50 max-w-sm mb-16 leading-relaxed font-sans font-light">
            Today&apos;s photographic set is complete. The archive will refresh tomorrow.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col items-center w-full max-w-xs sm:max-w-md">
            {!adAlreadyUnlocked && onRequestReflection && reflectionLevel < 3 && (
              <div className="w-full flex flex-col items-center mb-6">
                <button
                  type="button"
                  disabled={cooldownRemaining > 0}
                  onClick={onRequestReflection}
                  className={`w-full border py-3.5 px-8 font-sans text-[10px] font-light uppercase tracking-[0.15em] transition-all text-center rounded-[2px] ${
                    cooldownRemaining > 0
                      ? 'border-outline/10 text-muted/35 cursor-not-allowed bg-transparent'
                      : 'border-accent-amber/25 hover:border-accent-amber/50 text-accent-amber hover:bg-white/2 cursor-pointer'
                  }`}
                >
                  {cooldownRemaining > 0 ? 'Allow the archive to stabilize.' : reflectionLevel === 1 ? 'Continue Observation' : reflectionLevel === 2 ? 'One final unstable record remains.' : 'Request Reflection'}
                </button>
                <p className="text-[9px] font-sans font-light tracking-wide text-muted/30 mt-3 text-center">
                  {cooldownRemaining > 0
                    ? `Neural pathways stabilizing... (${cooldownRemaining}s remaining)`
                    : reflectionLevel === 1
                      ? 'Two unstable records remain.'
                      : reflectionLevel === 2
                        ? 'This archive was not intended for prolonged observation.'
                        : 'Observe another sequence. A sponsor-supported reflection will play.'}
                </p>
              </div>
            )}

            {onUnlockExtraPlay && !adWatched && (
              <div className="w-full flex flex-col items-center mb-6">
                <button
                  type="button"
                  disabled={adPlaying}
                  onClick={handleWatchAndReplay}
                  className="w-full border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/5 transition-all py-3.5 px-8 text-center font-sans text-[10px] font-light uppercase tracking-[0.15em] rounded-[2px] active:scale-[0.985] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adPlaying ? 'Playing…' : '▶ Watch & Play Again'}
                </button>
                <p className="text-[9px] font-sans font-light tracking-wide text-muted/30 mt-3 text-center">
                  Watch a short sponsor message to replay today&apos;s archive.
                </p>
              </div>
            )}

            {showOverlay && <CalmAdTransitionOverlay state={overlayPhase} />}
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
              <Link 
                href="/profile" 
                className="flex-1 border border-outline/10 py-3.5 px-8 font-sans text-[10px] font-light uppercase tracking-[0.15em] text-muted hover:text-foreground hover:bg-white/2 transition-all text-center rounded-[2px]"
              >
                Perception Record
              </Link>
              <Link 
                href="/leaderboard" 
                className="flex-1 border border-outline/10 py-3.5 px-8 font-sans text-[10px] font-light uppercase tracking-[0.15em] text-muted hover:text-foreground hover:bg-white/2 transition-all text-center rounded-[2px]"
              >
                Observer Registry
              </Link>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
