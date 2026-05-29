'use client';

import { useState, useCallback } from 'react';

/**
 * useRewardedAd – provides a rewarded ad experience using Google H5 Games Ads.
 *
 * The global `adBreak()` function is initialized in layout.tsx via:
 *   adConfig({ preloadAdBreaks: 'on', sound: 'on' });
 *
 * Strategy:
 *  1. Call adBreak({ type: 'reward', ... }) — Google will show a real rewarded video
 *     if one is available (and AdSense H5 Games Ads is enabled for the publisher).
 *  2. If no ad is available (adBreakDone fires with breakStatus !== 'viewed'),
 *     fall back to the CalmAdTransitionOverlay interstitial.
 *  3. If the SDK isn't loaded at all (ad blocker, network error), fall back immediately.
 */

declare global {
  interface Window {
    adsbygoogle: any[];
    adBreak: (o: any) => void;
  }
}

const OVERLAY_DURATION_MS = 4000; // 4-second fallback interstitial

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

    // Check if the H5 Games Ads adBreak function is available
    const adBreakFn = window.adBreak || ((o: any) => window.adsbygoogle?.push(o));

    if (!window.adsbygoogle) {
      console.log('[useRewardedAd] No ad SDK loaded (ad blocker?). Using overlay fallback.');
      runFallbackOverlay();
      return;
    }

    setAdPlaying(true);

    try {
      adBreakFn({
        type: 'reward',                    // H5 Games Ads rewarded format
        name: 'unlock_extra_set',
        beforeReward: (showAdFn: () => void) => {
          console.log('[adBreak] Rewarded ad is ready. Triggering showAdFn...');
          showAdFn();
        },
        beforeAd: () => {
          console.log('[adBreak] Ad starting...');
        },
        afterAd: () => {
          console.log('[adBreak] Ad finished.');
        },
        adDismissed: () => {
          // User skipped the ad — no reward
          console.log('[adBreak] Ad dismissed by user.');
          setAdPlaying(false);
          if (onAdClosed) onAdClosed();
        },
        adViewed: () => {
          // User watched the full ad — grant reward!
          console.log('[adBreak] Ad viewed — reward granted!');
          setAdPlaying(false);
          onRewardEarned();
        },
        adBreakDone: (placementInfo: any) => {
          const status = placementInfo?.breakStatus;
          console.log('[adBreak] Done, status:', status);

          // If ad was viewed or dismissed, the handlers above already fired.
          // If no ad was available, fall back to overlay.
          if (status !== 'viewed' && status !== 'dismissed') {
            console.log('[adBreak] No ad available (status:', status, '). Using overlay fallback.');
            runFallbackOverlay();
          }
        },
      });
    } catch (e) {
      console.warn('[adBreak] Push failed, using overlay fallback:', e);
      runFallbackOverlay();
    }
  }, [onRewardEarned, onAdClosed, runFallbackOverlay]);

  return { triggerAd, adPlaying, showOverlay, overlayPhase };
}
