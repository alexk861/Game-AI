'use client';

import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function useRewardedAd(onRewardEarned: () => void, onAdClosed?: () => void) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if the script has initialized
    const checkInterval = setInterval(() => {
      if (window.adsbygoogle) {
        clearInterval(checkInterval);
        
        // Push initial game config if not already initialized
        try {
          window.adsbygoogle.push({
            preloadAdBreaks: 'on',
            onAdBreakDone: (info: any) => {
              console.log('[adBreak] H5 Games Ads Done:', info);
            }
          });
        } catch {
          // Might already be initialized, ignore
        }
        
        setAdLoaded(true);
      }
    }, 200);

    // Timeout check after 10 seconds to stop polling if ad blockers are active
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
    };
  }, []);

  const triggerAd = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Usability Fallback: if adsbygoogle script fails to load (due to adblockers/network),
    // let's grant the reward fallback immediately so the game loop never freezes or locks out players.
    if (!window.adsbygoogle) {
      console.warn('[adsbygoogle] Script not loaded. Granting reward fallback.');
      onRewardEarned();
      return;
    }

    setAdPlaying(true);

    try {
      window.adsbygoogle.push({
        adBreakType: 'reward',
        adBreakName: 'unlock_extra_set',
        beforeAdRecieved: () => {
          // Pause game timers or audio
        },
        adDismissed: () => {
          setAdPlaying(false);
          if (onAdClosed) onAdClosed();
        },
        adViewed: () => {
          setAdPlaying(false);
          onRewardEarned(); // Reward granted!
        },
        adBreakDone: (status: any) => {
          setAdPlaying(false);
          console.log('[adBreak] complete status:', status);
          if (onAdClosed) onAdClosed();
        }
      });
    } catch (e) {
      console.error('[adsbygoogle] Failed to push adBreak:', e);
      setAdPlaying(false);
      if (onAdClosed) onAdClosed();
      // Fallback in case of runtime error
      onRewardEarned();
    }
  }, [onRewardEarned, onAdClosed]);

  return { triggerAd, adPlaying, adLoaded };
}
