'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';

/**
 * useRewardedAd – provides a rewarded ad experience across both Web and Native platforms.
 *
 * Strategy:
 *  1. If running on Native (iOS/Android): Call native Google AdMob SDK rewarded video via @capacitor-community/admob.
 *  2. If running on Web: Fall back to Google H5 Games Ads SDK (window.adBreak).
 *  3. In either platform: If the SDK fails, stalls, or is blocked by an ad-blocker, automatically
 *     fallback to our beautiful CSS-animated CalmAdTransitionOverlay local interstitial sequence,
 *     ensuring the player is never locked and always receives their reward gracefully.
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

  const adStartedRef = useRef(false);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  // Cleanup safety timer on unmount
  useEffect(() => {
    return () => clearSafetyTimer();
  }, [clearSafetyTimer]);

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

  // 1. Native AdMob Logic (iOS/Android)
  const triggerNativeAd = useCallback(async () => {
    setAdPlaying(true);
    adStartedRef.current = false;
    clearSafetyTimer();

    // Start 3.0s safety timer: If AdMob fails to initialize or stalls, automatically run fallback
    safetyTimerRef.current = setTimeout(() => {
      if (!adStartedRef.current) {
        console.warn('[useRewardedAd] Native AdMob unresponsive after 3.0s. Triggering fallback.');
        clearSafetyTimer();
        runFallbackOverlay();
      }
    }, 3000);

    try {
      // Step A: Initialize
      await AdMob.initialize({
        initializeForTesting: process.env.NODE_ENV !== 'production'
      });

      // Request tracking authorization for iOS >14 if native platform is iOS
      if (Capacitor.getPlatform() === 'ios') {
        try {
          await AdMob.requestTrackingAuthorization();
        } catch {}
      }

      // Step B: Set up rewarded event listeners
      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        console.log('[AdMob] Native Reward Earned:', reward);
        adStartedRef.current = true;
        clearSafetyTimer();
        onRewardEarned();
      });

      const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        console.log('[AdMob] Native Ad Closed');
        clearSafetyTimer();
        setAdPlaying(false);
        if (onAdClosed) onAdClosed();
        rewardListener.remove();
        dismissListener.remove();
      });

      // Step C: Prepare Reward Ad
      // Uses custom environment variables if configured, falling back to standard Google test unit IDs.
      const customIosId = process.env.NEXT_PUBLIC_ADMOB_REWARDED_AD_ID_IOS;
      const customAndroidId = process.env.NEXT_PUBLIC_ADMOB_REWARDED_AD_ID_ANDROID;
      
      const isCustomConfigured = Capacitor.getPlatform() === 'ios' ? !!customIosId : !!customAndroidId;
      const adId = Capacitor.getPlatform() === 'ios'
        ? customIosId || 'ca-app-pub-3940256099942544/1712485313'
        : customAndroidId || 'ca-app-pub-3940256099942544/5224354917';

      await AdMob.prepareRewardVideoAd({
        adId: adId,
        isTesting: !isCustomConfigured
      });

      adStartedRef.current = true;
      clearSafetyTimer();

      // Step D: Present Ad
      await AdMob.showRewardVideoAd();
    } catch (err) {
      console.warn('[useRewardedAd] Native AdMob load failed. Executing local fallback.', err);
      clearSafetyTimer();
      runFallbackOverlay();
    }
  }, [onRewardEarned, onAdClosed, runFallbackOverlay, clearSafetyTimer]);

  // 2. Web Google H5 AdSense / AdBreak Logic
  const triggerWebAd = useCallback(() => {
    const adBreakFn = window.adBreak || ((o: any) => window.adsbygoogle?.push(o));

    if (!window.adsbygoogle) {
      console.log('[useRewardedAd] No ad SDK loaded (ad blocker?). Using overlay fallback.');
      runFallbackOverlay();
      return;
    }

    setAdPlaying(true);
    adStartedRef.current = false;
    clearSafetyTimer();

    // Start 2.5s safety timeout
    safetyTimerRef.current = setTimeout(() => {
      if (!adStartedRef.current) {
        console.warn('[useRewardedAd] AdSense H5 SDK unresponsive after 2.5s. Triggering fallback.');
        clearSafetyTimer();
        runFallbackOverlay();
      }
    }, 2500);

    try {
      adBreakFn({
        type: 'reward',
        name: 'unlock_extra_set',
        beforeReward: (showAdFn: () => void) => {
          console.log('[adBreak] Rewarded ad is ready. Triggering showAdFn...');
          adStartedRef.current = true;
          clearSafetyTimer();
          showAdFn();
        },
        beforeAd: () => {
          console.log('[adBreak] Ad starting...');
          adStartedRef.current = true;
          clearSafetyTimer();
        },
        afterAd: () => {
          console.log('[adBreak] Ad finished.');
          clearSafetyTimer();
        },
        adDismissed: () => {
          console.log('[adBreak] Ad dismissed by user.');
          clearSafetyTimer();
          setAdPlaying(false);
          if (onAdClosed) onAdClosed();
        },
        adViewed: () => {
          console.log('[adBreak] Ad viewed — reward granted!');
          clearSafetyTimer();
          setAdPlaying(false);
          onRewardEarned();
        },
        adBreakDone: (placementInfo: any) => {
          clearSafetyTimer();
          const status = placementInfo?.breakStatus;
          console.log('[adBreak] Done, status:', status);
          if (status !== 'viewed' && status !== 'dismissed') {
            console.log('[adBreak] No ad available. Using overlay fallback.');
            runFallbackOverlay();
          }
        },
      });
    } catch (e) {
      console.warn('[adBreak] Push failed, using overlay fallback:', e);
      clearSafetyTimer();
      runFallbackOverlay();
    }
  }, [onRewardEarned, onAdClosed, runFallbackOverlay, clearSafetyTimer]);

  // Dynamic Router Dispatch
  const triggerAd = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (Capacitor.isNativePlatform()) {
      void triggerNativeAd();
    } else {
      triggerWebAd();
    }
  }, [triggerNativeAd, triggerWebAd]);

  return { triggerAd, adPlaying, showOverlay, overlayPhase };
}
