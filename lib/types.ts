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
  guesses_ai: number;
  guesses_real: number;
}

export interface UncannyStorage {
  todayDate: string;
  todayResults: GuessResult[];
  todayCompleted: boolean;
  currentStreak: number;
  lastPlayedDate: string;
  bestStreak: number;
  totalSetsPlayed: number;
  totalCorrect: number;
}

export type GamePhase =
  | 'loading'
  | 'playing'
  | 'revealing'
  | 'completed'
  | 'error';

export interface RevealData {
  correct: boolean;
  answer: 'ai' | 'real';
  context_short: string;
  ai_prompt: string | null;
  source_credit: string | null;
  guesses_ai: number;
  guesses_real: number;
}
