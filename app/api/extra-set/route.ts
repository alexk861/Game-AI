import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { FALLBACK_POOL, FALLBACK_CHALLENGES } from '@/lib/fallbackChallenges';

export const dynamic = 'force-dynamic';

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return 'fam_' + Math.abs(hash).toString(36);
}

function normalizePrompt(prompt: string | null | undefined): string {
  if (!prompt) return '';
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { level, seed, excludeImageUrls = [], excludeChallengeIds = [], excludeParentIds = [], seenHistory = [] } = body;

    if (!level || typeof level !== 'number' || level < 1 || level > 3) {
      return NextResponse.json({ error: 'Invalid extra level parameter.' }, { status: 400 });
    }

    const activeSeed = seed || `extra-${level}-${Date.now()}`;
    const supabase = getSupabase();
    const isOffline = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let allCandidates: any[] = [];
    let isDbConnected = false;

    if (!isOffline) {
      try {
        const { data, error } = await supabase
          .from('content_candidates')
          .select('id, source, source_photo_id, image_url, answer, source_type, candidate_score, suspicious_score, difficulty_suggestion, status, safety_status, photographer_name, parent_real_candidate_id, prompt_used')
          .in('status', ['approved', 'auto_approved'])
          .eq('safety_status', 'safe')
          .not('image_url', 'is', null)
          .not('answer', 'is', null);

        if (!error && data) {
          allCandidates = data;
          isDbConnected = true;
        }
      } catch (err) {
        console.error('[extra-set] Supabase candidates fetch failed, falling back to pool:', err);
      }
    }

    // ── Build Candidates Pools ──
    let aiCandidates = [];
    let realCandidates = [];

    if (isDbConnected && allCandidates.length > 0) {
      aiCandidates = allCandidates.filter(c =>
        c.answer === 'ai' &&
        c.source_type === 'ai_generated' &&
        (c.candidate_score ?? 0) >= 75 &&
        (c.suspicious_score ?? 0) >= 70 &&
        !!c.prompt_used
      );

      realCandidates = allCandidates.filter(c =>
        c.answer === 'real' &&
        !!c.photographer_name
      );
    } else {
      // Fallback Pool integration (Offline / Local Dev / Pool deficit)
      aiCandidates = FALLBACK_POOL.filter(c => c.answer === 'ai');
      realCandidates = FALLBACK_POOL.filter(c => c.answer === 'real');
    }

    // ── Exclusion and Relaxation Engine ──
    let expectedCount = level === 1 ? 3 : level === 2 ? 2 : 1;
    let expectedOrders = level === 1 ? [6, 7, 8] : level === 2 ? [9, 10] : [11];

    let finalSelected: any[] = [];
    let relaxationApplied = 30;
    let fallbackUsed = false;

    // We try selection at multiple seen history thresholds (30 days -> 14 days -> 7 days -> repeats allowed)
    for (const daysLimit of [30, 14, 7, 0]) {
      relaxationApplied = daysLimit;

      // Calculate exclusions based on age
      const excludeUrls = new Set<string>(excludeImageUrls);
      const excludeIds = new Set<string>(excludeChallengeIds);
      const excludeParents = new Set<string>(excludeParentIds);

      if (daysLimit > 0 && seenHistory && Array.isArray(seenHistory)) {
        const threshold = Date.now() - (daysLimit * 24 * 60 * 60 * 1000);
        seenHistory.forEach((entry: any) => {
          try {
            if (new Date(entry.seenAt).getTime() >= threshold) {
              if (entry.imageUrl) excludeUrls.add(entry.imageUrl);
              if (entry.challengeId) excludeIds.add(entry.challengeId);
              if (entry.parentId) excludeParents.add(entry.parentId);
            }
          } catch {
            // ignore malformed dates
          }
        });
      }

      // Filter pools
      const filteredReal = realCandidates.filter(c => 
        !excludeUrls.has(c.image_url) &&
        !excludeIds.has(c.id) &&
        !excludeIds.has(c.source_photo_id) &&
        (!c.parent_real_candidate_id || !excludeParents.has(c.parent_real_candidate_id))
      );

      const filteredAi = aiCandidates.filter(c => 
        !excludeUrls.has(c.image_url) &&
        !excludeIds.has(c.id) &&
        !excludeIds.has(c.source_photo_id) &&
        (!c.parent_real_candidate_id || !excludeParents.has(c.parent_real_candidate_id))
      );

      // Seeded Shuffler
      let seedVal = 0;
      const seedInput = activeSeed + `_limit_${daysLimit}`;
      for (let i = 0; i < seedInput.length; i++) {
        seedVal = seedInput.charCodeAt(i) + ((seedVal << 5) - seedVal);
      }
      let seed = Math.abs(seedVal);

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

      const shuffledReal = shuffle(filteredReal);
      const shuffledAi = shuffle(filteredAi);

      // Select candidate mix
      let selected: any[] = [];

      if (level === 1) {
        // Prefer 1 Real + 2 AI or 2 Real + 1 AI
        const realCount = random() > 0.5 ? 2 : 1;
        const aiCount = 3 - realCount;

        if (shuffledReal.length >= realCount && shuffledAi.length >= aiCount) {
          selected = [...shuffledReal.slice(0, realCount), ...shuffledAi.slice(0, aiCount)];
        }
      } else if (level === 2) {
        // Any mix of 2
        if (shuffledReal.length + shuffledAi.length >= 2) {
          const combined = [...shuffledReal, ...shuffledAi];
          selected = shuffle(combined).slice(0, 2);
        }
      } else {
        // Strongest available 1
        if (shuffledReal.length > 0 || shuffledAi.length > 0) {
          const combined = [...shuffledReal, ...shuffledAi];
          selected = [shuffle(combined)[0]];
        }
      }

      // Check deduplication invariants within the same set
      if (selected.length === expectedCount) {
        const setUrls = new Set<string>();
        const setParents = new Set<string>();
        const setPrompts = new Set<string>();
        let valid = true;

        for (const c of selected) {
          const promptFp = c.prompt_used ? normalizePrompt(c.prompt_used) : '';
          const parentFp = c.parent_real_candidate_id || '';

          if (setUrls.has(c.image_url)) { valid = false; break; }
          if (parentFp && setParents.has(parentFp)) { valid = false; break; }
          if (promptFp && setPrompts.has(promptFp)) { valid = false; break; }

          setUrls.add(c.image_url);
          if (parentFp) setParents.add(parentFp);
          if (promptFp) setPrompts.add(promptFp);
        }

        if (valid) {
          finalSelected = selected;
          break; // Set successfully constructed!
        }
      }
    }

    // ── Emergency Fallback if all else fails ──
    if (finalSelected.length < expectedCount) {
      fallbackUsed = true;
      console.warn(`[extra-set] Warning: Candidate exclusions relaxed entirely. Falling back to pool.`);
      const rawFallback = FALLBACK_CHALLENGES[level] || [];
      finalSelected = rawFallback.slice(0, expectedCount);
      console.warn(`[extra_pool_relaxed_due_to_low_candidates] extra_pool_relaxed_due_to_low_candidates triggered for level ${level}`);
    }

    if (relaxationApplied < 30) {
      console.warn(`[freshness_relaxed] freshness_relaxed to ${relaxationApplied} days for extra play level ${level}. Reason: pool constraints.`);
      if (relaxationApplied === 0) {
        console.warn(`[extra_set_repeat_used] extra_set_repeat_used triggered for level ${level}. Repeats allowed.`);
      }
    }

    // ── Pacing Sorting ──
    finalSelected.sort((a, b) => (a.difficulty || a.difficulty_suggestion || 3) - (b.difficulty || b.difficulty_suggestion || 3));

    // ── Display Sanitization (Part 3) ──
    const sanitizedChallenges = finalSelected.map((c, idx) => {
      const familyId = c.parent_real_candidate_id 
        ? simpleHash(c.parent_real_candidate_id) 
        : simpleHash(c.id);

      return {
        id: c.id,
        image_url: c.image_url,
        difficulty: c.difficulty || c.difficulty_suggestion || 3,
        set_order: expectedOrders[idx] || (idx + 6),
        family_id: familyId,
        parent_real_candidate_id: c.parent_real_candidate_id || null
      };
    });

    return NextResponse.json({
      level,
      date: new Date().toISOString().split('T')[0],
      challenges: sanitizedChallenges,
      isFallbackSet: fallbackUsed
    });

  } catch (err) {
    console.error('[extra-set API Error]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
