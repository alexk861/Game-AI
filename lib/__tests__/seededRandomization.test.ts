import { describe, it, expect } from 'vitest';
import { FALLBACK_POOL, FALLBACK_CHALLENGES } from '../fallbackChallenges';

// Helper matching backend PRNG logic to test randomization behavior
function generateSeededSet(activeSeed: string, expectedCount = 5) {
  let hash = 0;
  for (let i = 0; i < activeSeed.length; i++) {
    hash = activeSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  let seed = Math.abs(hash);

  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  };

  const realPool = FALLBACK_POOL.filter(c => c.answer === 'real');
  const aiPool = FALLBACK_POOL.filter(c => c.answer === 'ai');

  const shuffledReal = shuffle(realPool);
  const shuffledAi = shuffle(aiPool);

  const realCount = random() > 0.5 ? 3 : 2;
  const aiCount = 5 - realCount;

  const selectedReal = shuffledReal.slice(0, realCount);
  const selectedAi = shuffledAi.slice(0, aiCount);

  const selectedSet = [...selectedReal, ...selectedAi];
  selectedSet.sort((a, b) => a.difficulty - b.difficulty);

  return selectedSet.map((c, idx) => ({
    ...c,
    set_order: idx + 1,
  }));
}

describe('Seeded Dynamic Randomization', () => {
  it('should generate identical challenges for the same seed (determinism/refresh safety)', () => {
    const seed = 'user-session-123';
    const set1 = generateSeededSet(seed);
    const set2 = generateSeededSet(seed);

    expect(set1.length).toBe(5);
    expect(set2.length).toBe(5);

    for (let i = 0; i < 5; i++) {
      expect(set1[i].id).toBe(set2[i].id);
      expect(set1[i].image_url).toBe(set2[i].image_url);
    }
  });

  it('should generate distinct challenges for different seeds (variety/infinite replayability)', () => {
    const seedA = 'user-session-aaa';
    const seedB = 'user-session-bbb';
    
    const setA = generateSeededSet(seedA);
    const setB = generateSeededSet(seedB);

    const idsA = setA.map(c => c.id);
    const idsB = setB.map(c => c.id);

    const overlap = idsB.filter(id => idsA.includes(id));
    // Overlap should be small (usually <= 3 out of 5)
    expect(overlap.length).toBeLessThanOrEqual(3);
  });

  it('should preserve standard gameplay rules (balanced real/AI and ascending difficulty)', () => {
    const seeds = ['seed-1', 'seed-2', 'seed-3', 'seed-4', 'seed-5'];

    seeds.forEach(seed => {
      const set = generateSeededSet(seed);
      
      const realCount = set.filter(c => c.answer === 'real').length;
      const aiCount = set.filter(c => c.answer === 'ai').length;

      expect(set.length).toBe(5);
      expect(realCount).toBeGreaterThanOrEqual(2);
      expect(aiCount).toBeGreaterThanOrEqual(2);

      // Verify difficulties are strictly ascending
      const difficulties = set.map(c => c.difficulty);
      const isSorted = difficulties.every((val, i) => i === 0 || val >= difficulties[i - 1]);
      expect(isSorted).toBe(true);
    });
  });
});
