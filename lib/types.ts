// ── Uncanny Type Definitions ──

export interface Challenge {
  id: string;
  image_url: string;
  difficulty: number;
  set_order: number;
}

export interface GuessResult {
  challengeId: string;
  guess: 'ai' | 'real' | 'timeout';
  correct: boolean;
  timeRemaining: number;
  answer?: 'ai' | 'real';
  imageUrl?: string;
  reasoningTag?: string;
}

export interface DailySetResponse {
  date: string;
  challenges: Challenge[];
}

export interface GuessRequest {
  challengeId: string;
  guess: 'ai' | 'real';
}

export interface GuessResponse {
  correct: boolean;
  answer: 'ai' | 'real';
  context_short: string;
  ai_prompt: string | null;
  source_credit: string | null;
  photographer_name: string | null;
  photographer_url: string | null;
  unsplash_url: string | null;
  guesses_ai: number;
  guesses_real: number;
}

export interface UncannyStorage {
  todayDate: string;
  todayStarted: boolean;
  todayStartedAt: number | null;
  todayResults: GuessResult[];
  todayCompleted: boolean;
  todayCompletedAt: number | null;
  todayCompletionMs: number | null;
  currentStreak: number;
  lastPlayedDate: string;
  bestStreak: number;
  totalSetsPlayed: number;
  totalCorrect: number;
  todayAdUnlocked?: boolean;
  rewardedReflectionUsedToday?: boolean;
  rewardedReflectionUnlockedAt?: string | null;
  rewardedReflectionCompleted?: boolean;
  rewardedReflectionResults?: GuessResult[];
  rewardedReflectionCompletionMs?: number | null;
  reflectionLevel?: number;
  reflectionUnlockCountToday?: number;
  lastReflectionUnlockAt?: string | null;
}

export type GamePhase =
  | 'loading'
  | 'entry'
  | 'playing'
  | 'investigating'
  | 'revealing'
  | 'completed'
  | 'exhausted'
  | 'error';

export interface RevealData {
  correct: boolean;
  answer: 'ai' | 'real';
  context_short: string;
  ai_prompt: string | null;
  source_credit: string | null;
  photographer_name: string | null;
  photographer_url: string | null;
  unsplash_url: string | null;
  guesses_ai: number;
  guesses_real: number;
}
