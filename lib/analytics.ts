// ── GA4 Analytics Helper ──

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export const track = (event: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params);
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
};
