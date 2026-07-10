import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRewardedAd } from '../useRewardedAd';
import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

// Mock Capacitor core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
}));

// Mock Capacitor AdMob plugin
vi.mock('@capacitor-community/admob', () => {
  const listeners: Record<string, Function> = {};
  return {
    RewardAdPluginEvents: {
      Rewarded: 'onRewardedVideoReward',
      Dismissed: 'onRewardedVideoDismissed',
    },
    AdMob: {
      initialize: vi.fn().mockResolvedValue({}),
      requestTrackingAuthorization: vi.fn().mockResolvedValue({}),
      prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
      showRewardVideoAd: vi.fn().mockResolvedValue({}),
      addListener: vi.fn((event, callback) => {
        listeners[event] = callback;
        return Promise.resolve({
          remove: () => {
            delete listeners[event];
          },
        });
      }),
      // Helper for tests to trigger native events
      _triggerEvent: (event: string, data?: any) => {
        if (listeners[event]) {
          listeners[event](data);
        }
      },
    },
  };
});

describe('useRewardedAd Hook', () => {
  const onRewardEarned = vi.fn();
  const onAdClosed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Clean up window globals
    delete (window as any).adsbygoogle;
    delete (window as any).adBreak;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers local Calm fallback overlay when ad blocker is present on Web', async () => {
    // 1. Arrange: set Web platform (non-native) and no ad scripts loaded
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    
    // 2. Act: render hook and trigger ad
    const { result } = renderHook(() => useRewardedAd(onRewardEarned, onAdClosed));
    
    act(() => {
      result.current.triggerAd();
    });

    // 3. Assert: should immediately activate fallback overlay phase due to ad-blocker
    expect(result.current.adPlaying).toBe(true);
    expect(result.current.showOverlay).toBe(true);
    expect(result.current.overlayPhase).toBe('decompressing');

    // 4. Act: fast-forward past Phase 1 to Phase 2 (reentering transitions)
    act(() => {
      vi.advanceTimersByTime(2800);
    });
    expect(result.current.overlayPhase).toBe('reentering');

    // 5. Act: complete remaining fallback duration (4.0s total)
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // 6. Assert: overlay hides, ad finishes, and reward callback is triggered
    expect(result.current.showOverlay).toBe(false);
    expect(result.current.adPlaying).toBe(false);
    expect(onRewardEarned).toHaveBeenCalledTimes(1);
  });

  it('navigates native AdMob SDK prepare-and-show loop on Android', async () => {
    // 1. Arrange: set native platform Android
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android');

    // 2. Act: render hook and trigger ad
    const { result } = renderHook(() => useRewardedAd(onRewardEarned, onAdClosed));
    
    act(() => {
      result.current.triggerAd();
    });

    await act(async () => {
      await Promise.resolve();
    });

    // 3. Assert: native SDK should prepare and initialize
    expect(AdMob.initialize).toHaveBeenCalled();
    expect(AdMob.prepareRewardVideoAd).toHaveBeenCalled();

    // 4. Act: Simulate successful show and rewarded callback
    act(() => {
      // Trigger AdMob native rewarded callback event
      (AdMob as any)._triggerEvent('onRewardedVideoReward', { type: 'coins', amount: 1 });
    });
    
    expect(onRewardEarned).toHaveBeenCalledTimes(1);

    // 5. Act: Simulate ad close/dismissal
    act(() => {
      (AdMob as any)._triggerEvent('onRewardedVideoDismissed');
    });

    expect(result.current.adPlaying).toBe(false);
    expect(onAdClosed).toHaveBeenCalledTimes(1);
  });

  it('triggers local Calm fallback overlay if native AdMob SDK stalls or times out', async () => {
    // 1. Arrange: set native platform iOS
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');

    // Set AdMob.initialize to stall/hang
    vi.mocked(AdMob.initialize).mockImplementation(() => new Promise(() => {}));

    // 2. Act: render hook and trigger ad
    const { result } = renderHook(() => useRewardedAd(onRewardEarned, onAdClosed));
    
    act(() => {
      result.current.triggerAd();
    });

    // 3. Act: Fast forward past the 3.0s safety timer
    act(() => {
      vi.advanceTimersByTime(3100);
    });

    // 4. Assert: should trigger safety local Calm fallback overlay instead of hanging forever
    expect(result.current.showOverlay).toBe(true);
    expect(result.current.overlayPhase).toBe('decompressing');

    // 5. Act: complete fallback duration (4.0s)
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onRewardEarned).toHaveBeenCalled();
  });
});
