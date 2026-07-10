// ── GA4 & Native Firebase Analytics Helper ──

import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';
import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export const track = (event: string, params?: Record<string, unknown>) => {
  // If running on a native platform (Android/iOS), route events to native Firebase Analytics
  if (Capacitor.isNativePlatform()) {
    FirebaseAnalytics.logEvent({
      name: event,
      params: params || {},
    }).catch(err => {
      console.error('[FirebaseAnalytics] Failed to log native event:', err);
    });
  } else {
    // If running on web, fallback to the standard gtag.js implementation
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, params);
    }
  }
};

// Pre-defined event helpers for type safety
export const analytics = {
  sessionStarted: (setDate: string) =>
    track('session_started', { set_date: setDate }),

  challengeStarted: (challengeId: string, setOrder: number, difficulty: number) =>
    track('challenge_started', { challenge_id: challengeId, set_order: setOrder, difficulty }),

  guessSubmitted: (challengeId: string, guess: string, correct: boolean, timeRemaining: number) =>
    track('guess_submitted', { challenge_id: challengeId, guess, correct, time_remaining: timeRemaining }),

  resultCorrect: (challengeId: string, setOrder: number, difficulty: number) =>
    track('result_correct', { challenge_id: challengeId, set_order: setOrder, difficulty }),

  resultWrong: (challengeId: string, setOrder: number, difficulty: number) =>
    track('result_wrong', { challenge_id: challengeId, set_order: setOrder, difficulty }),

  challengeRevealed: (challengeId: string, correct: boolean) =>
    track('challenge_revealed', { challenge_id: challengeId, correct }),

  timerExpired: (challengeId: string, setOrder: number) =>
    track('timer_expired', { challenge_id: challengeId, set_order: setOrder }),

  setCompleted: (score: number, streak: number, setDate: string) =>
    track('set_completed', { score, streak, set_date: setDate }),

  shareTapped: (score: number, method: 'native' | 'copy') =>
    track('share_tapped', { score, method }),

  returningUser: (streak: number, totalSetsPlayed: number) =>
    track('returning_user', { streak, total_sets_played: totalSetsPlayed }),

  investigateUsed: (challengeId: string, difficulty: number) =>
    track('investigate_used', { challenge_id: challengeId, difficulty }),

  reflectionRequest: (level: number) =>
    track('reflection_request', { level }),

  reflectionAdStarted: (level: number) =>
    track('reflection_ad_started', { level }),

  reflectionAdCompleted: (level: number) =>
    track('reflection_ad_completed', { level }),

  reflectionAdDismissed: (level: number) =>
    track('reflection_ad_dismissed', { level }),

  reflectionLevelStarted: (level: number) =>
    track('reflection_level_started', { level }),

  reflectionLevelCompleted: (level: number) =>
    track('reflection_level_completed', { level }),

  reflectionDropout: (level: number) =>
    track('reflection_dropout', { level }),

  anomalyCompletion: () =>
    track('anomaly_completion'),

  shareModuleViewed: (score: number) =>
    track('share_module_viewed', { score }),

  shareNativeSuccess: (score: number) =>
    track('share_native_success', { score }),

  shareCopySuccess: (score: number) =>
    track('share_copy_success', { score }),

  shareFailed: (score: number) =>
    track('share_failed', { score }),

  challengeCleanLinkOpened: (setDate: string) =>
    track('challenge_clean_link_opened', { set_date: setDate }),

  challengeCompleted: (score: number, completionMs: number, setDate: string) =>
    track('challenge_completed', { score, completion_ms: completionMs, set_date: setDate }),

  challengeShareBackClicked: (score: number) =>
    track('challenge_share_back_clicked', { score }),

  challengeShareBackSuccess: (score: number) =>
    track('challenge_share_back_success', { score }),

  leaderboardViewed: (setDate: string) =>
    track('leaderboard_viewed', { set_date: setDate }),

  leaderboardSubmitted: (score: number, completionMs: number, setDate: string) =>
    track('leaderboard_submitted', { score, completion_ms: completionMs, set_date: setDate }),

  socialTeaserAssetGenerated: (setDate: string) =>
    track('social_teaser_asset_generated', { set_date: setDate }),
};
