import { describe, it, expect, vi } from 'vitest';
import { POST } from '../route';

// Mock Supabase to bypass network requests
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        in: () => ({
          eq: () => ({
            not: () => ({
              not: () => Promise.resolve({ data: null, error: new Error('Db offline') })
            })
          })
        })
      })
    })
  })
}));

describe('Extra Play API Endpoint', () => {
  it('returns level-specific balances and correct challenge counts', async () => {
    // Test Level 1
    let req = new Request('http://localhost/api/extra-set', {
      method: 'POST',
      body: JSON.stringify({ level: 1, seed: 'test-seed-1' })
    });
    let res = await POST(req);
    expect(res.status).toBe(200);
    let data = await res.json();
    expect(data.level).toBe(1);
    expect(data.challenges.length).toBe(3);
    
    // Test Level 2
    req = new Request('http://localhost/api/extra-set', {
      method: 'POST',
      body: JSON.stringify({ level: 2, seed: 'test-seed-2' })
    });
    res = await POST(req);
    expect(res.status).toBe(200);
    data = await res.json();
    expect(data.level).toBe(2);
    expect(data.challenges.length).toBe(2);

    // Test Level 3
    req = new Request('http://localhost/api/extra-set', {
      method: 'POST',
      body: JSON.stringify({ level: 3, seed: 'test-seed-3' })
    });
    res = await POST(req);
    expect(res.status).toBe(200);
    data = await res.json();
    expect(data.level).toBe(3);
    expect(data.challenges.length).toBe(1);
  });

  it('excludes seen history items properly', async () => {
    // Fetch Level 1 challenges
    let req = new Request('http://localhost/api/extra-set', {
      method: 'POST',
      body: JSON.stringify({ level: 1, seed: 'exclude-test' })
    });
    let res = await POST(req);
    let data = await res.json();
    const seenChallenge = data.challenges[0];

    // Request Level 1 again, excluding the first challenge
    req = new Request('http://localhost/api/extra-set', {
      method: 'POST',
      body: JSON.stringify({
        level: 1,
        seed: 'exclude-test',
        excludeImageUrls: [seenChallenge.image_url],
        excludeChallengeIds: [seenChallenge.id],
      })
    });
    res = await POST(req);
    let data2 = await res.json();
    const ids = data2.challenges.map((c: any) => c.id);
    expect(ids).not.toContain(seenChallenge.id);
  });

  it('never leaks prompt_used, safety status, answer, or attribution credits beyond Display fields', async () => {
    const req = new Request('http://localhost/api/extra-set', {
      method: 'POST',
      body: JSON.stringify({ level: 1, seed: 'leak-test' })
    });
    const res = await POST(req);
    const data = await res.json();
    
    data.challenges.forEach((c: any) => {
      expect(c.answer).toBeUndefined();
      expect(c.source_type).toBeUndefined();
      expect(c.prompt_used).toBeUndefined();
      expect(c.safety_status).toBeUndefined();
      expect(c.photographer_name).toBeUndefined();
      expect(c.unsplash_url).toBeUndefined();
      expect(c.image_url).toBeDefined();
      expect(c.id).toBeDefined();
      expect(c.difficulty).toBeDefined();
      expect(c.set_order).toBeDefined();
    });
  });
});
