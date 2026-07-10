import type { GuessResult, UncannyStorage } from './types';
import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

const STORAGE_KEY = 'uncanny_state';
let inMemoryCache: UncannyStorage | null = null;
let isStorageWarmed = false;

const getToday = (): string => {
  return new Date().toISOString().split('T')[0]; // "2026-05-17"
};

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'uc_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const defaultState: UncannyStorage = {
  deviceId: '',
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
  todaySeed: '',
  reflectionSeed: '',
  seenImageUrls: [],
  seenChallengeIds: [],
  seenParentIds: [],
  seenAtByImageUrl: {},
  seenLog: [],
  activeExtraChallenges: [],
  activeExtraResults: [],
  extraSeed: '',
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

/**
 * Performs asynchronous bootloading of hardware secure Keystore data into the in-memory cache.
 * Must be executed inside the root page/layout useEffect mounting sequence.
 */
export async function bootstrapStorage(): Promise<UncannyStorage> {
  if (typeof window === 'undefined') return defaultState;

  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await SecureStoragePlugin.get({ key: STORAGE_KEY });
      if (value) {
        const decoded = decodeState(value);
        let parsed = JSON.parse(decoded);
        if (!parsed.deviceId) {
          parsed.deviceId = generateUUID();
        }
        inMemoryCache = {
          ...defaultState,
          ...parsed,
        };
        // Keep standard localStorage warm as immediate backup
        localStorage.setItem(STORAGE_KEY, encodeState(JSON.stringify(inMemoryCache)));
        isStorageWarmed = true;
        return inMemoryCache || defaultState;
      }
    } catch (e) {
      console.warn('[Storage] Native Keystore secure storage empty or unavailable:', e);
    }
  }

  // Load from local storage if memory cache is still uninitialized
  if (!inMemoryCache) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const decoded = decodeState(raw);
        let parsed = JSON.parse(decoded);
        if (!parsed.deviceId) {
          parsed.deviceId = generateUUID();
          localStorage.setItem(STORAGE_KEY, encodeState(JSON.stringify(parsed)));
        }
        inMemoryCache = {
          ...defaultState,
          ...parsed,
        };
      } else {
        const initial = { ...defaultState, deviceId: generateUUID() };
        localStorage.setItem(STORAGE_KEY, encodeState(JSON.stringify(initial)));
        inMemoryCache = initial;
      }
    } catch {
      inMemoryCache = { ...defaultState, deviceId: generateUUID() };
    }
  }

  isStorageWarmed = true;
  return inMemoryCache || defaultState;
}

export function getDeviceId(): string {
  const state = getStorage();
  if (state.deviceId) return state.deviceId;
  
  // Resilient fallback in case bootstrap wasn't completed or localStorage fails (e.g. private mode)
  try {
    const raw = localStorage.getItem('transient_device_id');
    if (raw) return raw;
    const generated = 'uc_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('transient_device_id', generated);
    return generated;
  } catch {
    // Private mode / local storage disabled completely: return in-memory transient id
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (!win.__transientDeviceId) {
        win.__transientDeviceId = 'uc_temp_' + Math.random().toString(36).substring(2, 10);
      }
      return win.__transientDeviceId;
    }
    return 'uc_server_fallback';
  }
}

export function getStorage(): UncannyStorage {
  if (typeof window === 'undefined') return defaultState;

  if (inMemoryCache) {
    return inMemoryCache;
  }

  // Synchronous recovery / fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const decoded = decodeState(raw);
    inMemoryCache = {
      ...defaultState,
      ...JSON.parse(decoded),
    };
    return inMemoryCache || defaultState;
  } catch {
    return defaultState;
  }
}

export function saveStorage(state: UncannyStorage): void {
  if (typeof window === 'undefined') return;

  // Auto-prune and cap seen log history before saving
  pruneSeenLog(state);

  // 1. Immediately update in-memory cache
  inMemoryCache = state;

  const serialized = JSON.stringify(state);
  const encoded = encodeState(serialized);

  // 2. Synchronous write to standard localStorage
  try {
    localStorage.setItem(STORAGE_KEY, encoded);
  } catch (err) {
    console.warn('[storage] Failed to save state to localStorage:', err);
  }

  // 3. Asynchronous background write to native hardware Keystore GCM
  if (Capacitor.isNativePlatform()) {
    SecureStoragePlugin.set({ key: STORAGE_KEY, value: encoded })
      .catch(err => {
        console.error('[storage] Native SecureStorage Keystore write failed:', err);
      });
  }
}

export function initTodaySession(): UncannyStorage {
  const state = getStorage();
  const today = getToday();

  // Already initialized for today
  if (state.todayDate === today) {
    if (!state.todaySeed) {
      state.todaySeed = generateUUID();
      saveStorage(state);
    }
    return state;
  }

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
    todaySeed: generateUUID(),
    reflectionSeed: '',
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
    todaySeed: generateUUID(),
    activeExtraChallenges: [],
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
    reflectionSeed: generateUUID(),
    activeExtraChallenges: [],
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

export function pruneSeenLog(state: UncannyStorage): void {
  const CLIENT_SEEN_IMAGE_DAYS = 30;
  const maxSeenLogEntries = 500;

  const now = Date.now();
  const threshold = now - (CLIENT_SEEN_IMAGE_DAYS * 24 * 60 * 60 * 1000);

  // 1. Initialize lists if missing
  state.seenLog = state.seenLog || [];
  state.seenImageUrls = state.seenImageUrls || [];
  state.seenChallengeIds = state.seenChallengeIds || [];
  state.seenParentIds = state.seenParentIds || [];
  state.seenAtByImageUrl = state.seenAtByImageUrl || {};

  // 2. Remove entries older than 30 days
  let activeLog = state.seenLog.filter(entry => {
    try {
      return new Date(entry.seenAt).getTime() >= threshold;
    } catch {
      return false; // Skip malformed dates
    }
  });

  // 3. Cap total entries to maxSeenLogEntries = 500 (keep newest entries)
  activeLog.sort((a, b) => new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime()); // descending (newest first)
  if (activeLog.length > maxSeenLogEntries) {
    activeLog = activeLog.slice(0, maxSeenLogEntries);
  }

  state.seenLog = activeLog;

  // 4. Rebuild seenImageUrls, seenChallengeIds, seenParentIds, seenAtByImageUrl
  const urls: string[] = [];
  const challengeIds: string[] = [];
  const parentIds: string[] = [];
  const dateMap: Record<string, string> = {};

  activeLog.forEach(entry => {
    if (entry.imageUrl) {
      urls.push(entry.imageUrl);
      dateMap[entry.imageUrl] = entry.seenAt;
    }
    if (entry.challengeId) {
      challengeIds.push(entry.challengeId);
    }
    if (entry.parentId) {
      parentIds.push(entry.parentId);
    }
  });

  state.seenImageUrls = urls;
  state.seenChallengeIds = challengeIds;
  state.seenParentIds = parentIds;
  state.seenAtByImageUrl = dateMap;
}

export function markChallengeSeen(challenge: { id: string; image_url: string; parent_real_candidate_id?: string }): UncannyStorage {
  const state = getStorage();
  state.seenLog = state.seenLog || [];

  const alreadySeen = state.seenLog.some(entry => entry.challengeId === challenge.id || entry.imageUrl === challenge.image_url);
  if (!alreadySeen) {
    state.seenLog.push({
      imageUrl: challenge.image_url,
      challengeId: challenge.id,
      parentId: challenge.parent_real_candidate_id,
      seenAt: new Date().toISOString()
    });
  }

  saveStorage(state);
  return state;
}
