import type { GuessResult, UncannyStorage } from './types';

const STORAGE_KEY = 'uncanny_state';

const getToday = (): string => {
  return new Date().toISOString().split('T')[0]; // "2026-05-17"
};

const defaultState: UncannyStorage = {
  todayDate: '',
  todayStarted: false,
  todayStartedAt: null,
  todayResults: [],
  todayCompleted: false,
  todayCompletedAt: null,
  todayCompletionMs: null,
  currentStreak: 0,
  lastPlayedDate: '',
  bestStreak: 0,
  totalSetsPlayed: 0,
  totalCorrect: 0,
  rewardedReflectionUsedToday: false,
  rewardedReflectionUnlockedAt: null,
  rewardedReflectionCompleted: false,
  rewardedReflectionResults: [],
  rewardedReflectionCompletionMs: null,
  reflectionLevel: 0,
  reflectionUnlockCountToday: 0,
  lastReflectionUnlockAt: null,
};

const encodeState = (data: string): string => {
  if (typeof window === 'undefined') return data;
  return window.btoa(encodeURIComponent(data));
};

const decodeState = (data: string): string => {
  if (typeof window === 'undefined') return data;
  try {
    return decodeURIComponent(window.atob(data));
  } catch {
    return data; // Gracious fallback for pre-existing plaintext JSON states
  }
};

export function getStorage(): UncannyStorage {
  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const decoded = decodeState(raw);
    return {
      ...defaultState,
      ...JSON.parse(decoded),
    } as UncannyStorage;
  } catch {
    return defaultState;
  }
}

export function saveStorage(state: UncannyStorage): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, encodeState(serialized));
  } catch (err) {
    console.warn('[storage] Failed to save state to localStorage:', err);
  }
}

export function initTodaySession(): UncannyStorage {
  const state = getStorage();
  const today = getToday();

  // Already initialized for today
  if (state.todayDate === today) return state;

  // New day — update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const newStreak =
    state.lastPlayedDate === yesterdayStr
      ? state.currentStreak // will increment when set is completed
      : state.lastPlayedDate === today
        ? state.currentStreak
        : 0; // streak broken

  const newState: UncannyStorage = {
    ...state,
    todayDate: today,
    todayStarted: false,
    todayStartedAt: null,
    todayResults: [],
    todayCompleted: false,
    todayCompletedAt: null,
    todayCompletionMs: null,
    currentStreak: newStreak,
    todayAdUnlocked: false,
    rewardedReflectionUsedToday: false,
    rewardedReflectionUnlockedAt: null,
    rewardedReflectionCompleted: false,
    rewardedReflectionResults: [],
    rewardedReflectionCompletionMs: null,
    reflectionLevel: 0,
    reflectionUnlockCountToday: 0,
    lastReflectionUnlockAt: null,
  };

  saveStorage(newState);
  return newState;
}

export function markTodayStarted(): UncannyStorage {
  const state = initTodaySession();
  const newState: UncannyStorage = {
    ...state,
    todayStarted: true,
    todayStartedAt: state.todayStartedAt ?? Date.now(),
  };

  saveStorage(newState);
  return newState;
}

export function addResult(result: GuessResult): UncannyStorage {
  const state = getStorage();
  state.todayStarted = true;
  state.todayStartedAt = state.todayStartedAt ?? Date.now();
  state.todayResults = [...state.todayResults, result];

  if (result.correct) {
    state.totalCorrect += 1;
  }

  saveStorage(state);
  return state;
}

export function updateLatestReasoningTag(tag: string): UncannyStorage {
  const state = getStorage();
  if (state.todayResults.length === 0) return state;

  const latestIndex = state.todayResults.length - 1;
  state.todayResults = state.todayResults.map((result, index) =>
    index === latestIndex ? { ...result, reasoningTag: tag } : result
  );

  saveStorage(state);
  return state;
}

export function completeSet(completedAt = Date.now()): UncannyStorage {
  const state = getStorage();
  const today = getToday();

  if (state.todayDate === today && state.todayCompleted) {
    return state;
  }

  state.todayStarted = true;
  state.todayStartedAt = state.todayStartedAt ?? completedAt;
  state.todayCompleted = true;
  state.todayCompletedAt = completedAt;
  state.todayCompletionMs = Math.max(0, completedAt - state.todayStartedAt);
  state.totalSetsPlayed += 1;
  const previousLastPlayedDate = state.lastPlayedDate;
  state.lastPlayedDate = today;

  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If played yesterday or just started, increment streak
  if (state.currentStreak === 0 || previousLastPlayedDate === yesterdayStr || previousLastPlayedDate === today) {
    state.currentStreak += 1;
  }

  if (state.currentStreak > state.bestStreak) {
    state.bestStreak = state.currentStreak;
  }

  saveStorage(state);
  return state;
}

export function getTodayScore(): number {
  const state = getStorage();
  return state.todayResults.filter(r => r.correct).length;
}

export function hasCompletedToday(): boolean {
  const state = getStorage();
  const today = getToday();
  return state.todayDate === today && state.todayCompleted;
}

export function hasStartedToday(): boolean {
  const state = getStorage();
  const today = getToday();
  return state.todayDate === today && (state.todayStarted || state.todayResults.length > 0 || state.todayCompleted);
}

export function getResumeIndex(): number {
  const state = getStorage();
  const today = getToday();
  if (state.todayDate !== today) return 0;
  return state.todayResults.length;
}

export function resetTodaySessionForAdExtraPlay(): UncannyStorage {
  const state = getStorage();
  const newState: UncannyStorage = {
    ...state,
    todayStarted: false,
    todayStartedAt: null,
    todayResults: [],
    todayCompleted: false,
    todayCompletedAt: null,
    todayCompletionMs: null,
    todayAdUnlocked: true,
  };
  saveStorage(newState);
  return newState;
}

export function unlockRewardedReflection(): UncannyStorage {
  const state = getStorage();
  const currentLevel = state.reflectionLevel ?? 0;
  const currentCount = state.reflectionUnlockCountToday ?? 0;
  const newState: UncannyStorage = {
    ...state,
    rewardedReflectionUsedToday: true,
    reflectionLevel: currentLevel + 1,
    reflectionUnlockCountToday: currentCount + 1,
    rewardedReflectionUnlockedAt: new Date().toISOString(),
    rewardedReflectionCompleted: false,
    rewardedReflectionResults: [],
    rewardedReflectionCompletionMs: null,
  };
  saveStorage(newState);
  return newState;
}

export function addReflectionResult(result: GuessResult): UncannyStorage {
  const state = getStorage();
  const results = state.rewardedReflectionResults || [];
  state.rewardedReflectionResults = [...results, result];
  if (result.correct) {
    state.totalCorrect += 1;
  }
  saveStorage(state);
  return state;
}

export function completeReflection(completionMs: number): UncannyStorage {
  const state = getStorage();
  state.rewardedReflectionCompleted = true;
  state.rewardedReflectionCompletionMs = completionMs;
  state.lastReflectionUnlockAt = new Date().toISOString();
  saveStorage(state);
  return state;
}
