import { describe, it, expect } from 'vitest';
import { getDynamicFallbackChallenges } from '../fallbackChallenges';

describe('Uncanny Game Challenge Shuffling and Diversity', () => {
  it('should generate distinct and balanced challenges on consecutive days', () => {
    const dates = [
      '2026-05-31',
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05'
    ];
    
    const selectedSets: Record<string, string[]> = {};
    
    dates.forEach(date => {
      const challenges = getDynamicFallbackChallenges(0, date);
      const ids = challenges.map(c => c.id);
      selectedSets[date] = ids;
      
      const realCount = challenges.filter(c => c.answer === 'real').length;
      const aiCount = challenges.filter(c => c.answer === 'ai').length;
      
      // 1. Verify standard daily set size
      expect(challenges.length).toBe(5);
      
      // 2. Verify perfect balance constraint (at least 2 real, 2 AI)
      expect(realCount).toBeGreaterThanOrEqual(2);
      expect(aiCount).toBeGreaterThanOrEqual(2);
      
      // 3. Verify ascending difficulty progression for pacing tension
      const difficulties = challenges.map(c => c.difficulty);
      const isSorted = difficulties.every((val, i) => i === 0 || val >= difficulties[i - 1]);
      expect(isSorted).toBe(true);
    });
    
    // 4. Verify consecutive day variety (zero consecutive day identity)
    for (let i = 0; i < dates.length - 1; i++) {
      const d1 = dates[i];
      const d2 = dates[i+1];
      const set1 = new Set(selectedSets[d1]);
      const set2 = selectedSets[d2];
      
      const common = set2.filter(id => set1.has(id));
      
      // Overlap must be small to ensure high variety (typically <= 3 out of 5)
      expect(common.length).toBeLessThanOrEqual(3);
      
      console.log(`[Shuffling Test] ${d1} vs ${d2}: Overlap = ${common.length} items. New items = ${5 - common.length}/5`);
    }
  });
});
