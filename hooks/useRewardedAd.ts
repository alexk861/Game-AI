'use client';

import { useState, useCallback } from 'react';

/**
 * useRewardedAd – provides a "rewarded ad" experience.
 *
 * Strategy:
 *  1. If Google H5 Games Ads (adBreak API) is available AND healthy, use it.
 *  2. Otherwise, fall back to a timed interstitial overlay (CalmAdTransitionOverlay)
 *     so the game loop never locks out.
 *
 * The hook exposes:
 *  - triggerAd()    → call to start the ad / interstitial
 *  - adPlaying      → true while the ad or countdown is in progress
 *  - showOverlay    → true when the fallback overlay should render
 *  - overlayPhase   → 'decompressing' | 'reentering' for the overlay
 */

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const OVERLAY_DURATION_MS = 4000; // 4-second interstitial

export function useRewardedAd(onRewardEarned: () => void, onAdClosed?: () => void) {
  const [adPlaying, setAdPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<'decompressing' | 'reentering'>('decompressing');

  const runFallbackOverlay = useCallback(() => {
    setAdPlaying(true);
    setShowOverlay(true);
    setOverlayPhase('decompressing');

    // Phase 1: "decompressing" for most of the duration
    const reenterTimer = setTimeout(() => {
      setOverlayPhase('reentering');
    }, OVERLAY_DURATION_MS - 1200);

    // Phase 2: complete → grant reward
    const doneTimer = setTimeout(() => {
      setShowOverlay(false);
      setAdPlaying(false);
      onRewardEarned();
    }, OVERLAY_DURATION_MS);

    return () => {
      clearTimeout(reenterTimer);
      clearTimeout(doneTimer);
    };
  }, [onRewardEarned]);

  const triggerAd = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Try the real adBreak API first (H5 Games Ads)
    if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
      try {
        setAdPlaying(true);
        window.adsbygoogle.push({
          adBreakType: 'reward',
          adBreakName: 'unlock_extra_set',
          beforeAd: () => {
            // Ad is about to show — nothing to do
          },
          adDismissed: () => {
            setAdPlaying(false);
            if (onAdClosed) onAdClosed();
          },
          adViewed: () => {
            setAdPlaying(false);
            onRewardEarned();
          },
          adBreakDone: (placementInfo: any) => {
            // adBreakDone fires in ALL cases — including when no ad is available
            const status = placementInfo?.breakStatus;
            console.log('[adBreak] status:', status);

            // If ad was actually shown and viewed/dismissed, the handlers above already fired.
            // If no ad was available (status = 'notReady', 'timeout', 'error', 'noAdPreloaded', 'frequencyCapped')
            // → fall back to the overlay interstitial.
            if (status !== 'viewed' && status !== 'dismissed') {
              console.log('[adBreak] No ad available, using interstitial overlay fallback.');
              runFallbackOverlay();
            }
          },
        });
        return;
      } catch (e) {
        console.warn('[adsbygoogle] adBreak push failed, using fallback:', e);
      }
    }

    // Fallback: show the cinematic overlay interstitial
    console.log('[useRewardedAd] Using interstitial overlay (no ad SDK).');
    runFallbackOverlay();
  }, [onRewardEarned, onAdClosed, runFallbackOverlay]);

  return { triggerAd, adPlaying, showOverlay, overlayPhase };
}
