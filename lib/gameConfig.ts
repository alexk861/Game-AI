import { Capacitor } from '@capacitor/core';

export const TIMER_DURATION_SECONDS = 12;
export const TOTAL_DAILY_CHALLENGES = 5;

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;

  const isNative = Capacitor.isNativePlatform();
  const productionHost = 'https://www.uncanny.info';
  return isNative ? `${productionHost}${path}` : path;
}

// Puzzle #1 date (UTC). Adjust to the actual launch date if it differs.
export const UNCANNY_EPOCH = '2026-01-01';

// Day number for a YYYY-MM-DD date string, counted from UNCANNY_EPOCH (day 1), UTC math.
export function puzzleNumberFor(dateStr: string): number {
  const epoch = Date.UTC(
    Number(UNCANNY_EPOCH.slice(0, 4)),
    Number(UNCANNY_EPOCH.slice(5, 7)) - 1,
    Number(UNCANNY_EPOCH.slice(8, 10)),
  );
  const date = Date.UTC(
    Number(dateStr.slice(0, 4)),
    Number(dateStr.slice(5, 7)) - 1,
    Number(dateStr.slice(8, 10)),
  );
  return Math.max(1, Math.floor((date - epoch) / 86_400_000) + 1);
}

// Milliseconds until the next UTC midnight (when the next daily set unlocks —
// the server's date convention is toISOString().split('T')[0]).
export function msUntilNextSetUtc(now: Date = new Date()): number {
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return nextMidnight - now.getTime();
}
