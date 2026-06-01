import { describe, it, expect } from 'vitest';
import { getDynamicTags } from '../copy';

describe('Dynamic Reasoning Tags Selection', () => {
  it('should return exactly 3 unique tags', () => {
    const challengeId = '9d3fb29c-efee-4d7a-b15f-c0209f8742b6';
    const tags = getDynamicTags(challengeId);
    
    expect(tags).toHaveLength(3);
    // Check uniqueness
    const uniqueTags = new Set(tags);
    expect(uniqueTags.size).toBe(3);
  });

  it('should be deterministic (same challengeId always returns same tags)', () => {
    const challengeId = 'a1f8db11-0985-4089-9db2-5b91b92bf9de';
    const tags1 = getDynamicTags(challengeId);
    const tags2 = getDynamicTags(challengeId);

    expect(tags1).toEqual(tags2);
  });

  it('should return different tags for different challenge IDs', () => {
    const idA = '3a1f8db1-0985-4089-9db2-5b91b92bf9de';
    const idB = '7c9e0a2b-cf39-4be2-ba64-50cbbe25e89d';

    const tagsA = getDynamicTags(idA);
    const tagsB = getDynamicTags(idB);

    // They shouldn't be exactly the same
    expect(tagsA).not.toEqual(tagsB);
  });

  it('should fallback to default tags when challengeId is undefined', () => {
    const defaultTags = getDynamicTags(undefined);
    expect(defaultTags).toEqual(['lighting', 'texture', 'too clean']);
  });
});
