'use client';

import { useState, useEffect, useCallback } from 'react';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import Link from 'next/link';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import CalmAdTransitionOverlay from './CalmAdTransitionOverlay';
import UncannyLogo from '@/components/UncannyLogo';

interface ArchiveExhaustedProps {
  onUnlockExtraPlay?: () => void;
  onRequestReflection?: () => void;
  adAlreadyUnlocked?: boolean;
  reflectionLevel?: number;
  lastReflectionUnlockAt?: string | null;
  isFallbackSet?: boolean;
}

export default function ArchiveExhausted({
  onUnlockExtraPlay,
  onRequestReflection,
  adAlreadyUnlocked = false,
  reflectionLevel = 0,
  lastReflectionUnlockAt = null,
  isFallbackSet = false,
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
          <UncannyLogo size={48} className="mb-8" />
          <div className="font-mono text-label font-light uppercase tracking-kicker text-muted/90 mb-10">
            Today's Set
          </div>
          
          <h1 className="font-sans text-2xl md:text-3xl font-light tracking-wide text-foreground mb-6">
            All images reviewed.
          </h1>
          
          <p className="text-sm text-muted/95 max-w-sm mb-16 leading-relaxed font-sans font-light">
            Today's set is complete. A new set arrives tomorrow.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col items-center w-full max-w-xs sm:max-w-md">
            {!adAlreadyUnlocked && onRequestReflection && reflectionLevel < 3 && (
              <div className="w-full flex flex-col items-center mb-6">
                <button
                  type="button"
                  disabled={cooldownRemaining > 0}
                  onClick={onRequestReflection}
                  className={`w-full min-h-14 border py-3.5 px-8 font-mono text-label font-light uppercase tracking-label transition-all text-center ${
                    cooldownRemaining > 0
                      ? 'border-border-dim/60 text-muted/65 cursor-not-allowed bg-transparent'
                      : 'border-outline/60 hover:border-outline text-foreground hover:bg-white/2 active:border-outline active:bg-white/2 cursor-pointer'
                  }`}
                >
                  {cooldownRemaining > 0 ? 'Preparing next set.' : reflectionLevel === 2 ? 'One final challenge remains.' : 'Continue Exploring'}
                </button>
                <p className="text-label font-sans font-light tracking-wide text-muted/90 mt-3 text-center">
                  {cooldownRemaining > 0
                    ? `Preparing next set... (${cooldownRemaining}s remaining)`
                    : reflectionLevel === 1
                      ? 'Two challenges remain. A short sponsor-supported video will play.'
                      : reflectionLevel === 2
                        ? 'This challenge was not intended for prolonged play. A short sponsor-supported video will play.'
                        : 'Explore another set of 3 images. A short sponsor-supported video will play.'}
                </p>
              </div>
            )}

            {onUnlockExtraPlay && !adWatched && (
              <div className="w-full flex flex-col items-center mb-6">
                <button
                  type="button"
                  disabled={adPlaying}
                  onClick={handleWatchAndReplay}
                  className="w-full min-h-14 border border-outline/60 hover:border-outline text-foreground hover:bg-white/2 active:border-outline active:bg-white/2 transition-all py-3.5 px-8 text-center font-mono text-label font-light uppercase tracking-label active:scale-[0.985] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adPlaying ? 'Playing…' : 'Replay Today\'s Set'}
                </button>
                <p className="text-label font-sans font-light tracking-wide text-muted/90 mt-3 text-center">
                  A short sponsor-supported video will play.
                </p>
              </div>
            )}

            {showOverlay && <CalmAdTransitionOverlay state={overlayPhase} />}
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
              <Link
                href="/profile"
                className="flex-1 min-h-14 flex items-center justify-center border border-outline/60 py-3.5 px-8 font-mono text-label font-light uppercase tracking-label text-muted/90 hover:text-foreground hover:bg-white/2 active:text-foreground active:bg-white/2 transition-all text-center"
              >
                Profile
              </Link>
              {!isFallbackSet && (
                <Link
                  href="/leaderboard"
                  className="flex-1 min-h-14 flex items-center justify-center border border-outline/60 py-3.5 px-8 font-mono text-label font-light uppercase tracking-label text-muted/90 hover:text-foreground hover:bg-white/2 active:text-foreground active:bg-white/2 transition-all text-center"
                >
                  Compare with players
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
