import { describe, it, expect } from 'vitest';
import { UNCANNY_EPOCH, puzzleNumberFor, msUntilNextSetUtc } from '../gameConfig';

describe('puzzleNumberFor', () => {
  it('returns 1 for the epoch date', () => {
    expect(puzzleNumberFor(UNCANNY_EPOCH)).toBe(1);
  });

  it('counts days from the epoch in UTC', () => {
    expect(puzzleNumberFor('2026-01-02')).toBe(2);
    expect(puzzleNumberFor('2026-02-01')).toBe(32);
  });

  it('never returns less than 1 for dates before the epoch', () => {
    expect(puzzleNumberFor('2025-12-31')).toBe(1);
  });
});

describe('msUntilNextSetUtc', () => {
  it('returns the ms remaining to the next UTC midnight', () => {
    const now = new Date('2026-07-09T23:59:00.000Z');
    expect(msUntilNextSetUtc(now)).toBe(60_000);
  });

  it('returns a full day minus one ms just after midnight', () => {
    const now = new Date('2026-07-09T00:00:00.001Z');
    expect(msUntilNextSetUtc(now)).toBe(86_400_000 - 1);
  });

  it('is always positive and at most 24h', () => {
    const ms = msUntilNextSetUtc();
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(86_400_000);
  });
});
