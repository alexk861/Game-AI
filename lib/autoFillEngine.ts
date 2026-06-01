// ── Uncanny Auto-Fill Engine ──
// Controlled content fallback for production stability.
// This is NOT full auto-publishing. This is a safety net.

import { SupabaseClient } from '@supabase/supabase-js';

// ─── Constants ───

const LOOKAHEAD_DAYS = 3;
const SAFETY_BUFFER = 15;
const MAX_AUTO_APPROVE = 30;
const PLAYABLE_SLOTS = 5;
const MAX_SLOTS = process.env.MAX_SCHEDULE_SLOTS ? parseInt(process.env.MAX_SCHEDULE_SLOTS, 10) : 11;

/** Difficulty distribution per set_order slot */
const SLOT_DIFFICULTY: Record<number, number> = {
  1: 1, // Easy
  2: 2, // Medium
  3: 3, // Hard
  4: 4, // Hard
  5: 5, // Extreme / controversial
  6: 3, // Hard (Bonus)
  7: 4, // Hard (Bonus)
  8: 4, // Hard (Bonus)
  9: 5, // Extreme (Black Archive)
  10: 5,
  11: 5,
};

// ─── Types ───

interface ContentCandidate {
  id: string;
  source: string;
  source_photo_id: string;
  image_url: string;
  image_thumb_url: string;
  photographer_name: string;
  photographer_url: string;
  unsplash_url: string;
  download_location: string;
  query: string;
  category: string;
  candidate_score: number;
  suspicious_score: number;
  difficulty_suggestion: number;
  suggested_context: string;
  license_note: string;
  status: string;
  answer?: string | null;
  source_type?: string | null;
  prompt_used?: string | null;
  safety_status?: string | null;
  safety_flags?: string[] | null;
  auto_approve_eligible?: boolean | null;
  composition_fingerprint?: string | null;
  emotional_fingerprint?: string | null;
  lighting_fingerprint?: string | null;
  perspective_fingerprint?: string | null;
  scene_fingerprint?: string | null;
  object_fingerprint?: string | null;
  texture_fingerprint?: string | null;
  consensus_confidence?: number | null;
  disagreement_score?: number | null;
  slow_burn_score?: number | null;
  curator_locked?: boolean | null;
  anomaly_tier?: number | null;
  parent_real_candidate_id?: string | null;
  total_served_count?: number | null;
}

interface ScheduleGap {
  date: string; // YYYY-MM-DD
  filledSlots: number[];
  missingSlots: number[];
}

export interface AutoFillReport {
  success: boolean;
  triggered: boolean;
  scheduled_count: number;
  auto_approved_count: number;
  days_filled: number;
  skipped_low_score: number;
  skipped_duplicates: number;
  skipped_no_attribution: number;
  schedule_before: number;
  schedule_after: number;
  errors: string[];
  details: string[];
}

// ─── Utilities ───

/** Format a Date as YYYY-MM-DD in UTC */
function formatDateUTC(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Get the next N dates starting from today (UTC) */
function getUpcomingDates(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i <= days; i++) {
    const d = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + i
    ));
    dates.push(formatDateUTC(d));
  }
  return dates;
}

// ─── Step 1: Check Schedule Gaps ───

async function checkScheduleGaps(
  supabase: SupabaseClient,
  days: number = LOOKAHEAD_DAYS
): Promise<{ totalScheduled: number; gaps: ScheduleGap[]; deficit: number }> {
  const dates = getUpcomingDates(days);

  const { data: existing, error } = await supabase
    .from('challenges')
    .select('set_date, set_order')
    .in('set_date', dates)
    .order('set_date')
    .order('set_order');

  if (error) {
    throw new Error(`Failed to check schedule gaps: ${error.message}`);
  }

  const gaps: ScheduleGap[] = [];
  let totalScheduled = 0;
  let playableScheduled = 0;

  for (const date of dates) {
    const dayRows = (existing || []).filter(
      (r: { set_date: string; set_order: number }) => r.set_date === date
    );
    const filledSlots = dayRows.map(
      (r: { set_date: string; set_order: number }) => r.set_order
    );
    totalScheduled += filledSlots.length;
    playableScheduled += filledSlots.filter((s: number) => s <= PLAYABLE_SLOTS).length;

    // Find missing slots (1-9)
    const allSlots = Array.from({ length: MAX_SLOTS }, (_, i) => i + 1);
    const missingSlots = allSlots.filter(s => !filledSlots.includes(s));

    if (missingSlots.length > 0) {
      gaps.push({ date, filledSlots, missingSlots });
    }
  }

  const requiredMinimum = SAFETY_BUFFER;
  const deficit = Math.max(0, requiredMinimum - playableScheduled);

  return { totalScheduled, gaps, deficit };
}

// ─── Step 2: Select Eligible Candidates ───

function normalizePrompt(prompt: string | null | undefined): string {
  if (!prompt) return '';
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function selectEligibleCandidates(
  supabase: SupabaseClient,
  limit: number = MAX_AUTO_APPROVE
): Promise<{
  selected: ContentCandidate[];
  skippedLowScore: number;
  skippedDuplicates: number;
  skippedNoAttribution: number;
  skippedCategoryLimit: number;
  logs: string[];
}> {
  const logs: string[] = [];
  logs.push('[auto-fill] Selecting eligible candidates...');

  // 1. Get already scheduled challenge details
  const { data: existingChallenges, error: chalError } = await supabase
    .from('challenges')
    .select('image_url, ai_prompt')
    .not('image_url', 'is', null);

  if (chalError) {
    logs.push(`[auto-fill] Warning: Failed to query existing challenges for duplicate check: ${chalError.message}`);
  }

  const existingImageUrls = new Set(
    (existingChallenges || []).map(c => c.image_url).filter(Boolean)
  );

  const existingPrompts = new Set(
    (existingChallenges || [])
      .map(c => normalizePrompt(c.ai_prompt))
      .filter(Boolean)
  );

  // 2. Fetch parent_real_candidate_id for scheduled candidates to check duplicates
  const existingParentIds = new Set<string>();
  if (existingImageUrls.size > 0) {
    const { data: matchedCandidates, error: matchError } = await supabase
      .from('content_candidates')
      .select('parent_real_candidate_id, prompt_used')
      .in('image_url', Array.from(existingImageUrls));

    if (matchError) {
      logs.push(`[auto-fill] Warning: Failed to query source candidates: ${matchError.message}`);
    } else if (matchedCandidates) {
      matchedCandidates.forEach(c => {
        if (c.parent_real_candidate_id) {
          existingParentIds.add(c.parent_real_candidate_id);
        }
        if (c.prompt_used) {
          existingPrompts.add(normalizePrompt(c.prompt_used));
        }
      });
    }
  }

  logs.push(`[duplicate-prevention] Existing DB items loaded: ${existingImageUrls.size} URLs, ${existingParentIds.size} Parent IDs, ${existingPrompts.size} prompt fingerprints.`);

  // 3. Get all review candidates (broader query, filter in-app for precise control)
  // Fetch 'review', 'approved', 'auto_approved' status candidates
  const { data: allCandidates, error: candError } = await supabase
    .from('content_candidates')
    .select('*')
    .in('status', ['review', 'approved', 'auto_approved'])
    .not('image_url', 'is', null)
    .order('candidate_score', { ascending: false })
    .order('suspicious_score', { ascending: false })
    .limit(100); // Over-fetch for filtering

  if (candError) {
    throw new Error(`Failed to fetch candidates: ${candError.message}`);
  }

  let scannedCount = 0;
  let skippedLowScore = 0;
  let skippedNoAttribution = 0;
  let skippedDupUrl = 0;
  let skippedDupParent = 0;
  let skippedDupPrompt = 0;
  let skippedCategoryLimit = 0;

  const selected: ContentCandidate[] = [];
  const usedCategories = new Map<string, number>();

  for (const candidate of allCandidates || []) {
    scannedCount++;
    if (selected.length >= limit) break;
    const typedCandidate = candidate as ContentCandidate;
    const isReal = typedCandidate.source === 'unsplash' || typedCandidate.source === 'real' || typedCandidate.answer === 'real';
    const isAi = (
      typedCandidate.source === 'nano_banana' &&
      typedCandidate.source_type === 'ai_generated' &&
      typedCandidate.answer === 'ai' &&
      typedCandidate.safety_status === 'safe' &&
      typedCandidate.auto_approve_eligible === true &&
      typeof typedCandidate.prompt_used === 'string' &&
      typedCandidate.prompt_used.trim().length > 0
    );

    if (!isReal && !isAi) {
      skippedLowScore++;
      continue;
    }

    // Label source mismatch guardrail (Real must not be AI URL, AI must not be Unsplash URL)
    const isUnsplashUrl = candidate.image_url && (candidate.image_url.includes('images.unsplash.com') || candidate.image_url.includes('unsplash.com'));
    const isAiUrl = candidate.image_url && (candidate.image_url.includes('/ai-generated/') || candidate.image_url.includes('/challenge-images/ai-generated/'));
    
    if (isReal && isAiUrl) {
      console.warn(`[auto-fill] rejected_label_source_mismatch: Candidate ID ${candidate.id} (${candidate.source_type || 'unknown'}) is labeled as 'real' but uses an AI URL.`);
      skippedLowScore++;
      continue;
    }
    
    if (isAi && isUnsplashUrl) {
      console.warn(`[auto-fill] rejected_label_source_mismatch: Candidate ID ${candidate.id} (${candidate.source_type || 'unknown'}) is labeled as 'ai' but uses an Unsplash URL.`);
      skippedLowScore++;
      continue;
    }

    if (candidate.status === 'deleted' || candidate.status === 'rejected') {
      skippedLowScore++;
      continue;
    }

    if (candidate.safety_status === 'unsafe') {
      skippedLowScore++;
      continue;
    }

    // Quality gate
    if (candidate.candidate_score < 40) {
      skippedLowScore++;
      continue;
    }

    // Attribution gate applies to real/Unsplash rows only.
    if (isReal && !candidate.photographer_name) {
      skippedNoAttribution++;
      continue;
    }

    // Three-Tier Duplicate prevention
    // Tier A: Image URL
    if (candidate.image_url && existingImageUrls.has(candidate.image_url)) {
      skippedDupUrl++;
      continue;
    }

    // Tier B: Parent Real Candidate ID
    if (candidate.parent_real_candidate_id && existingParentIds.has(candidate.parent_real_candidate_id)) {
      skippedDupParent++;
      continue;
    }

    // Tier C: Prompt Fingerprint Hash
    if (isAi && candidate.prompt_used) {
      const fingerprint = normalizePrompt(candidate.prompt_used);
      if (existingPrompts.has(fingerprint)) {
        skippedDupPrompt++;
        continue;
      }
    }

    // Diversity enforcement — avoid multiple images from the same category
    // within the same auto-fill batch (soft limit: max 3 per category)
    const cat = candidate.category || 'unknown';
    const catCount = usedCategories.get(cat) || 0;
    if (catCount >= 3) {
      skippedCategoryLimit++;
      continue; // Skip, try next candidate
    }

    selected.push(typedCandidate);
    usedCategories.set(cat, catCount + 1);

    // Track newly selected elements in our duplicate sets for the remainder of this selection run
    if (candidate.image_url) existingImageUrls.add(candidate.image_url);
    if (candidate.parent_real_candidate_id) existingParentIds.add(candidate.parent_real_candidate_id);
    if (isAi && candidate.prompt_used) existingPrompts.add(normalizePrompt(candidate.prompt_used));
  }

  logs.push(`[select-summary] Scanned ${scannedCount} candidates. Selected: ${selected.length}.`);
  logs.push(`[select-summary] Skip Reasons:`);
  logs.push(`  - Low Score/Quality: ${skippedLowScore}`);
  logs.push(`  - Missing Attribution: ${skippedNoAttribution}`);
  logs.push(`  - Duplicate URL: ${skippedDupUrl}`);
  logs.push(`  - Duplicate Parent ID: ${skippedDupParent}`);
  logs.push(`  - Duplicate Prompt Fingerprint: ${skippedDupPrompt}`);
  logs.push(`  - Category Diversity Limit (>3): ${skippedCategoryLimit}`);

  console.log(`[auto-fill] Candidate selection summary:`, {
    scanned: scannedCount,
    selected: selected.length,
    skippedLowScore,
    skippedNoAttribution,
    skippedDupUrl,
    skippedDupParent,
    skippedDupPrompt,
    skippedCategoryLimit,
  });

  return {
    selected,
    skippedLowScore,
    skippedDuplicates: skippedDupUrl + skippedDupParent + skippedDupPrompt,
    skippedNoAttribution,
    skippedCategoryLimit,
    logs,
  };
}

// ─── Step 3: Auto-Approve Candidates ───

async function checkRejectionReasonColumn(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('content_candidates')
      .select('rejection_reason')
      .limit(1);

    if (error) {
      if (
        error.code === 'PGRST100' || 
        (error.message && error.message.includes('rejection_reason')) ||
        (error.message && error.message.includes('column'))
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function autoApproveCandidates(
  supabase: SupabaseClient,
  candidates: ContentCandidate[]
): Promise<number> {
  if (candidates.length === 0) return 0;

  const ids = candidates.map(c => c.id);
  const hasRejectionReason = await checkRejectionReasonColumn(supabase);
  console.log(`[auto-fill] Schema check: 'rejection_reason' exists in DB = ${hasRejectionReason}`);

  const updatePayload: Record<string, unknown> = {
    status: 'auto_approved',
    reviewed_at: new Date().toISOString(),
  };

  if (hasRejectionReason) {
    updatePayload.rejection_reason = null;
  }

  const { error } = await supabase
    .from('content_candidates')
    .update(updatePayload)
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to auto-approve candidates: ${error.message}`);
  }

  return ids.length;
}

// ─── Step 4: Schedule Candidates into Challenges ───

async function getChallengesColumns(supabase: SupabaseClient): Promise<Set<string>> {
  const possibleColumns = [
    'id', 'set_date', 'set_order', 'image_url', 'answer', 'difficulty',
    'context_short', 'ai_prompt', 'source_credit', 'guesses_ai', 'guesses_real',
    'created_at', 'source_type', 'photographer_name', 'photographer_url',
    'unsplash_url', 'download_location'
  ];
  const existing = new Set<string>();
  await Promise.all(
    possibleColumns.map(async (col) => {
      try {
        const { error } = await supabase.from('challenges').select(col).limit(1);
        if (!error) {
          existing.add(col);
        }
      } catch {
        // ignore
      }
    })
  );
  return existing;
}

async function scheduleCandidates(
  supabase: SupabaseClient,
  candidates: ContentCandidate[],
  gaps: ScheduleGap[]
): Promise<{ scheduledCount: number; daysFilled: number; details: string[] }> {
  const challengesColumns = await getChallengesColumns(supabase);
  console.log(`[auto-fill] Detected 'challenges' columns:`, Array.from(challengesColumns));
  if (candidates.length === 0 || gaps.length === 0) {
    return { scheduledCount: 0, daysFilled: 0, details: ['No candidates or gaps to fill.'] };
  }

  const details: string[] = [];
  let scheduledCount = 0;
  let daysFilled = 0;
  let candidateIndex = 0;

  // Separate pools by source
  const realCandidates = candidates.filter(c => c.source === 'unsplash' || c.source === 'real' || c.answer === 'real');
  const aiCandidates = candidates.filter(c =>
    c.source === 'nano_banana' &&
    c.source_type === 'ai_generated' &&
    c.answer === 'ai' &&
    c.safety_status === 'safe' &&
    c.auto_approve_eligible === true &&
    !!c.prompt_used
  );

  // Evolve Paced Tension Difficulty Pools
  // Easy: high consensus (or suggestion <= 2)
  const realEasy = realCandidates.filter(c => {
    const useStats = c.total_served_count && c.total_served_count > 0;
    return (useStats && c.consensus_confidence !== undefined && c.consensus_confidence !== null ? c.consensus_confidence >= 0.70 : (c.difficulty_suggestion || 3) <= 2);
  }).sort((a, b) => (b.consensus_confidence || 0) - (a.consensus_confidence || 0));

  // Medium: moderate disagreement (or suggestion = 3)
  const realMedium = realCandidates.filter(c => {
    const useStats = c.total_served_count && c.total_served_count > 0;
    const dis = c.disagreement_score;
    return (useStats && dis !== undefined && dis !== null ? (dis >= 0.30 && dis <= 0.70) : (c.difficulty_suggestion || 3) === 3);
  }).sort((a, b) => (b.disagreement_score || 0) - (a.disagreement_score || 0));

  // Hard: high disagreement (or suggestion >= 4)
  const realHard = realCandidates.filter(c => {
    const useStats = c.total_served_count && c.total_served_count > 0;
    const dis = c.disagreement_score;
    return (useStats && dis !== undefined && dis !== null ? dis > 0.70 : (c.difficulty_suggestion || 3) >= 4);
  }).sort((a, b) => (b.disagreement_score || 0) - (a.disagreement_score || 0));

  // AI Easy
  const aiEasy = aiCandidates.filter(c => {
    const useStats = c.total_served_count && c.total_served_count > 0;
    return (useStats && c.consensus_confidence !== undefined && c.consensus_confidence !== null ? c.consensus_confidence >= 0.70 : (c.difficulty_suggestion || 3) <= 2);
  }).sort((a, b) => (b.consensus_confidence || 0) - (a.consensus_confidence || 0));

  // AI Medium
  const aiMedium = aiCandidates.filter(c => {
    const useStats = c.total_served_count && c.total_served_count > 0;
    const dis = c.disagreement_score;
    return (useStats && dis !== undefined && dis !== null ? (dis >= 0.30 && dis <= 0.70) : (c.difficulty_suggestion || 3) === 3);
  }).sort((a, b) => (b.disagreement_score || 0) - (a.disagreement_score || 0));

  // AI Hard
  const aiHard = aiCandidates.filter(c => {
    const useStats = c.total_served_count && c.total_served_count > 0;
    const dis = c.disagreement_score;
    return (useStats && dis !== undefined && dis !== null ? dis > 0.70 : (c.difficulty_suggestion || 3) >= 4);
  }).sort((a, b) => (b.disagreement_score || 0) - (a.disagreement_score || 0));

  // Track used candidate IDs to avoid double-assignment
  const usedIds = new Set<string>();
  // Track used categories per day for diversity
  const usedCategoriesPerDay = new Map<string, string[]>();
  // Visual Entropy: Track composition, lighting, and scene fingerprints scheduled per day Date
  const usedFingerprintsPerDay = new Map<string, {
    composition: Set<string>;
    lighting: Set<string>;
    scene: Set<string>;
  }>();

  // Load all scheduled challenges to compute 14-day repetition cooldowns
  const scheduledDetailsList: Array<{
    date: string;
    imageUrl: string;
    parentId?: string;
    promptFingerprint?: string;
  }> = [];

  try {
    const { data: allScheduled, error: schedError } = await supabase
      .from('challenges')
      .select('set_date, image_url, ai_prompt')
      .not('image_url', 'is', null);

    if (!schedError && allScheduled && allScheduled.length > 0) {
      const urls = allScheduled.map(s => s.image_url);
      const { data: matchedCandidates } = await supabase
        .from('content_candidates')
        .select('image_url, parent_real_candidate_id, prompt_used')
        .in('image_url', urls);

      const matchMap = new Map<string, { parentId?: string; promptFingerprint?: string }>();
      if (matchedCandidates) {
        matchedCandidates.forEach(c => {
          matchMap.set(c.image_url, {
            parentId: c.parent_real_candidate_id || undefined,
            promptFingerprint: c.prompt_used ? normalizePrompt(c.prompt_used) : undefined
          });
        });
      }

      allScheduled.forEach(s => {
        const match = matchMap.get(s.image_url);
        scheduledDetailsList.push({
          date: s.set_date,
          imageUrl: s.image_url,
          parentId: match?.parentId,
          promptFingerprint: match?.promptFingerprint || (s.ai_prompt ? normalizePrompt(s.ai_prompt) : undefined)
        });
      });
    }
  } catch (err) {
    console.error('[auto-fill] Failed to load scheduled challenges list for cooldown checks:', err);
  }

  function getDaysDiff(d1Str: string, d2Str: string): number {
    try {
      const t1 = new Date(d1Str).getTime();
      const t2 = new Date(d2Str).getTime();
      return Math.round((t2 - t1) / (24 * 60 * 60 * 1000));
    } catch {
      return 999;
    }
  }

  function checkCooldownConflict(
    c: ContentCandidate,
    gapDate: string,
    cooldownDays: number,
    skipLogs: string[]
  ): boolean {
    if (cooldownDays <= 0) return false;

    const candidatePromptFingerprint = c.prompt_used ? normalizePrompt(c.prompt_used) : '';

    for (const s of scheduledDetailsList) {
      const diff = getDaysDiff(s.date, gapDate);
      if (diff >= 1 && diff <= cooldownDays) {
        // Conflict A: image_url
        if (c.image_url && s.imageUrl === c.image_url) {
          skipLogs.push(`skipped_duplicate_image_url (imageUrl: ${c.image_url} seen ${diff} days ago on ${s.date})`);
          skipLogs.push(`skipped_recently_seen_official`);
          return true;
        }
        // Conflict B: parent_real_candidate_id
        if (c.parent_real_candidate_id && s.parentId === c.parent_real_candidate_id) {
          skipLogs.push(`skipped_duplicate_parent (parentId: ${c.parent_real_candidate_id} seen ${diff} days ago on ${s.date})`);
          skipLogs.push(`skipped_recently_seen_official`);
          return true;
        }
        // Conflict C: prompt fingerprint
        if (candidatePromptFingerprint && s.promptFingerprint === candidatePromptFingerprint) {
          skipLogs.push(`skipped_duplicate_prompt (prompt fingerprint seen ${diff} days ago on ${s.date})`);
          skipLogs.push(`skipped_recently_seen_official`);
          return true;
        }
      }
    }
    return false;
  }

  function pickCandidate(
    preferredSource: 'real' | 'ai',
    targetDifficulty: number,
    dayDate: string,
    slotNumber: number,
    cooldownDays: number,
    skipLogs: string[]
  ): ContentCandidate | null {
    const dayCategories = usedCategoriesPerDay.get(dayDate) || [];
    const dayFingerprints = usedFingerprintsPerDay.get(dayDate) || {
      composition: new Set<string>(),
      lighting: new Set<string>(),
      scene: new Set<string>()
    };

    // Slot 11 Anomaly Rule: Prefer anomaly_tier >= 2 first!
    if (slotNumber === 11) {
      const anomalies = aiCandidates
        .filter(c => (c.anomaly_tier || 0) >= 2 && !usedIds.has(c.id))
        .sort((a, b) => (b.anomaly_tier || 0) - (a.anomaly_tier || 0));
      for (const c of anomalies) {
        if (!checkCooldownConflict(c, dayDate, cooldownDays, skipLogs)) {
          return c;
        }
      }
    }

    const realPools = targetDifficulty <= 2 
      ? [realEasy, realMedium, realHard] 
      : targetDifficulty === 3 
        ? [realMedium, realHard, realEasy] 
        : [realHard, realMedium, realEasy];

    const aiPools = targetDifficulty <= 2 
      ? [aiEasy, aiMedium, aiHard] 
      : targetDifficulty === 3 
        ? [aiMedium, aiHard, aiEasy] 
        : [aiHard, aiMedium, aiEasy];

    const preferredPools = preferredSource === 'real' ? realPools : aiPools;
    const fallbackPools = preferredSource === 'real' ? aiPools : realPools;

    // 1st pass: Preferred pools with Category diversity & Visual Entropy Protection
    for (const pool of preferredPools) {
      for (const c of pool) {
        if (usedIds.has(c.id)) continue;
        const catOccurrences = dayCategories.filter(cat => cat === c.category).length;
        if (catOccurrences >= 2) continue;

        // Visual Entropy checking
        if (c.composition_fingerprint && dayFingerprints.composition.has(c.composition_fingerprint)) continue;
        if (c.lighting_fingerprint && dayFingerprints.lighting.has(c.lighting_fingerprint)) continue;
        if (c.scene_fingerprint && dayFingerprints.scene.has(c.scene_fingerprint)) continue;

        if (checkCooldownConflict(c, dayDate, cooldownDays, skipLogs)) continue;

        return c;
      }
    }

    // 2nd pass: Preferred pools with Visual Entropy Protection only
    for (const pool of preferredPools) {
      for (const c of pool) {
        if (usedIds.has(c.id)) continue;
        if (c.composition_fingerprint && dayFingerprints.composition.has(c.composition_fingerprint)) continue;
        if (c.lighting_fingerprint && dayFingerprints.lighting.has(c.lighting_fingerprint)) continue;
        if (c.scene_fingerprint && dayFingerprints.scene.has(c.scene_fingerprint)) continue;

        if (checkCooldownConflict(c, dayDate, cooldownDays, skipLogs)) continue;

        return c;
      }
    }

    // 3rd pass: Preferred pools without restrictions
    for (const pool of preferredPools) {
      for (const c of pool) {
        if (usedIds.has(c.id)) continue;
        if (checkCooldownConflict(c, dayDate, cooldownDays, skipLogs)) continue;
        return c;
      }
    }

    // 4th pass: Fallback pools with Category & Visual Entropy
    for (const pool of fallbackPools) {
      for (const c of pool) {
        if (usedIds.has(c.id)) continue;
        const catOccurrences = dayCategories.filter(cat => cat === c.category).length;
        if (catOccurrences >= 2) continue;
        if (c.composition_fingerprint && dayFingerprints.composition.has(c.composition_fingerprint)) continue;
        if (c.lighting_fingerprint && dayFingerprints.lighting.has(c.lighting_fingerprint)) continue;
        if (c.scene_fingerprint && dayFingerprints.scene.has(c.scene_fingerprint)) continue;

        if (checkCooldownConflict(c, dayDate, cooldownDays, skipLogs)) continue;

        return c;
      }
    }

    // 5th pass: Fallback pools without restrictions
    for (const pool of fallbackPools) {
      for (const c of pool) {
        if (usedIds.has(c.id)) continue;
        if (checkCooldownConflict(c, dayDate, cooldownDays, skipLogs)) continue;
        return c;
      }
    }

    return null;
  }

  function markUsed(c: ContentCandidate, dayDate: string) {
    usedIds.add(c.id);
    const cats = usedCategoriesPerDay.get(dayDate) || [];
    cats.push(c.category || 'unknown');
    usedCategoriesPerDay.set(dayDate, cats);

    const fingerprints = usedFingerprintsPerDay.get(dayDate) || {
      composition: new Set<string>(),
      lighting: new Set<string>(),
      scene: new Set<string>()
    };
    if (c.composition_fingerprint) fingerprints.composition.add(c.composition_fingerprint);
    if (c.lighting_fingerprint) fingerprints.lighting.add(c.lighting_fingerprint);
    if (c.scene_fingerprint) fingerprints.scene.add(c.scene_fingerprint);
    usedFingerprintsPerDay.set(dayDate, fingerprints);
  }

  const rowsToInsert: Record<string, unknown>[] = [];

  for (const gap of gaps) {
    let daySlotsFilled = 0;

    for (const slot of gap.missingSlots) {
      if (usedIds.size >= candidates.length) break; // No more candidates
      if (candidateIndex >= MAX_AUTO_APPROVE) break; // Hard limit

      const targetDifficulty = SLOT_DIFFICULTY[slot] || 3;
      
      // Determine preferred source based on set_order segment rules:
      // Slots 1-3: Prefer Real.
      // Slots 4-5: Prefer AI.
      // Slots 6-11: Prefer AI.
      const preferredSource = (slot >= 1 && slot <= 3) ? 'real' : 'ai';
      
      let picked = null;
      let appliedCooldown = 14;
      const skipLogs: string[] = [];

      for (const cooldownVal of [14, 7, 3, 0]) {
        picked = pickCandidate(preferredSource, targetDifficulty, gap.date, slot, cooldownVal, skipLogs);
        if (picked) {
          appliedCooldown = cooldownVal;
          break;
        }
      }

      if (!picked) {
        details.push(`[scheduling-failure] Slot ${slot} on ${gap.date} remained unfilled: preferred and fallback candidate pools exhausted.`);
        continue;
      }

      if (appliedCooldown < 14) {
        details.push(`[cooldown_relaxed] cooldown_relaxed_reason: candidate pool too small to satisfy 14-day cooldown for slot ${slot} on ${gap.date}. cooldown_days_applied: ${appliedCooldown}. skipped_recently_seen_official details: ${skipLogs.join(' | ')}`);
        if (appliedCooldown === 0) {
          details.push(`[repeated_as_last_resort] repeated_as_last_resort: Candidate ID ${picked.id} URL ${picked.image_url} repeated as a last resort.`);
        }
      }

      const contextShort = picked.suggested_context
        || `A ${picked.source === 'unsplash' ? 'real photo' : 'generated image'} from the ${picked.category || 'unknown'} category.`;

      const isReal = picked.source === 'unsplash' || picked.source === 'real' || picked.answer === 'real';
      const answer = isReal ? 'real' : 'ai';
      const sourceCredit = isReal ? `Unsplash / ${picked.photographer_name || 'Unknown'}` : (picked.photographer_name || 'AI Generated');

      // Check if fallback was used and log it
      const actualSource = isReal ? 'real' : 'ai';
      if (actualSource !== preferredSource) {
        details.push(`[fallback-used] Slot ${slot} on ${gap.date} used fallback source '${actualSource}' instead of preferred '${preferredSource}' due to pool deficit.`);
      }

      const rawRow: Record<string, unknown> = {
        set_date: gap.date,
        set_order: slot,
        image_url: picked.image_url,
        answer: answer,
        difficulty: isReal ? Math.min(3, Math.max(1, targetDifficulty)) : Math.min(5, Math.max(1, targetDifficulty)), 
        context_short: contextShort,
        ai_prompt: isReal ? null : (picked.prompt_used || picked.query || null),
        source_credit: sourceCredit,
        source_type: picked.source_type || picked.source || 'unknown',
        photographer_name: picked.photographer_name,
        photographer_url: picked.photographer_url,
        unsplash_url: picked.unsplash_url,
        download_location: picked.download_location,
      };

      const filteredRow: Record<string, unknown> = {};
      for (const key of Object.keys(rawRow)) {
        if (challengesColumns.has(key)) {
          filteredRow[key] = rawRow[key];
        }
      }
      rowsToInsert.push(filteredRow);

      markUsed(picked, gap.date);
      candidateIndex++;
      daySlotsFilled++;
    }

    if (daySlotsFilled > 0) {
      daysFilled++;
    }
  }

  // Bulk insert
  if (rowsToInsert.length > 0) {
    const { error } = await supabase
      .from('challenges')
      .insert(rowsToInsert);

    if (error) {
      throw new Error(`Failed to insert scheduled challenges: ${error.message}`);
    }

    scheduledCount = rowsToInsert.length;
  }

  // Post-fill telemetry validation to count and log exact real/AI mix and fallbacks
  try {
    const { data: allDayChallenges, error: queryError } = await supabase
      .from('challenges')
      .select('set_date, set_order, answer')
      .in('set_date', gaps.map(g => g.date))
      .order('set_date')
      .order('set_order');

    if (!queryError && allDayChallenges) {
      for (const gap of gaps) {
        const dayChallenges = allDayChallenges.filter(c => c.set_date === gap.date);
        const standardChallenges = dayChallenges.filter(c => c.set_order <= 5);
        const reflectionChallenges = dayChallenges.filter(c => c.set_order >= 6 && c.set_order <= 11);

        const realStandard = standardChallenges.filter(c => c.answer === 'real').length;
        const aiStandard = standardChallenges.filter(c => c.answer === 'ai').length;
        const realReflection = reflectionChallenges.filter(c => c.answer === 'real').length;
        const aiReflection = reflectionChallenges.filter(c => c.answer === 'ai').length;

        const totalStandard = standardChallenges.length;
        const totalReflection = reflectionChallenges.length;
        const standardMixMet = (realStandard === 3 && aiStandard === 2);

        let mixStatus = 'MIX MET';
        let fallbackReason = '';
        if (totalStandard === 5 && !standardMixMet) {
          mixStatus = 'MIX DEVIATION';
          fallbackReason = `Preferred standard mix (3 Real + 2 AI) could not be met due to candidate pool constraints. Serving ${realStandard} Real + ${aiStandard} AI to prioritize game availability.`;
        } else if (totalStandard < 5) {
          mixStatus = 'DEFICIT';
          fallbackReason = `Incomplete standard set (${totalStandard}/5 slots). Usable candidate pool depleted.`;
        }

        details.push(`[daily-set-telemetry] ${gap.date}: Standard Set = ${totalStandard}/5 [Real: ${realStandard}, AI: ${aiStandard}] (${mixStatus}). Reflection Slots = ${totalReflection}/6 [Real: ${realReflection}, AI: ${aiReflection}]. ${fallbackReason ? `Reason: ${fallbackReason}` : ''}`);
      }
    }
  } catch (telemetryErr) {
    console.error('Failed to generate scheduling post-fill telemetry:', telemetryErr);
  }

  return { scheduledCount, daysFilled, details };
}

// ─── Orchestrator ───

export async function runAutoFill(supabase: SupabaseClient): Promise<AutoFillReport> {
  const report: AutoFillReport = {
    success: false,
    triggered: false,
    scheduled_count: 0,
    auto_approved_count: 0,
    days_filled: 0,
    skipped_low_score: 0,
    skipped_duplicates: 0,
    skipped_no_attribution: 0,
    schedule_before: 0,
    schedule_after: 0,
    errors: [],
    details: [],
  };

  try {
    console.log('[auto-fill] Starting auto-fill check...');

    // 0. Recovery: Reset orphaned auto_approved candidates from previous failed runs
    const { data: orphaned } = await supabase
      .from('content_candidates')
      .update({ status: 'review', reviewed_at: null })
      .eq('status', 'auto_approved')
      .select('id');
    
    if (orphaned && orphaned.length > 0) {
      console.log(`[auto-fill] Recovered ${orphaned.length} orphaned auto_approved candidates.`);
      report.details.push(`Recovery: reset ${orphaned.length} orphaned auto_approved candidates.`);
    }

    // 1. Check schedule gaps
    const { totalScheduled, gaps, deficit } = await checkScheduleGaps(supabase);
    report.schedule_before = totalScheduled;
    report.details.push(`Current future inventory: ${totalScheduled} challenges across next ${LOOKAHEAD_DAYS} days.`);
    report.details.push(`Safety buffer target: ${SAFETY_BUFFER}. Deficit: ${deficit}.`);

    console.log(`[auto-fill] Future inventory: ${totalScheduled}, deficit: ${deficit}`);

    if (deficit === 0 && gaps.length === 0) {
      report.success = true;
      report.triggered = false;
      report.details.push('No auto-fill needed. Future schedule is sufficient.');
      console.log('[auto-fill] No auto-fill needed. Schedule is healthy.');
      return report;
    }

    report.triggered = true;
    report.details.push(`Schedule gaps found in ${gaps.length} day(s): ${gaps.map(g => g.date).join(', ')}`);

    // 2. Select eligible candidates
    const { selected, skippedLowScore, skippedDuplicates, skippedNoAttribution, logs } =
      await selectEligibleCandidates(supabase);

    report.skipped_low_score = skippedLowScore;
    report.skipped_duplicates = skippedDuplicates;
    report.skipped_no_attribution = skippedNoAttribution;
    report.details.push(...logs);

    console.log(`[auto-fill] Selected ${selected.length} candidates.`);

    if (selected.length === 0) {
      report.success = true;
      report.details.push('No eligible candidates available for auto-fill.');
      console.log('[auto-fill] No eligible candidates. Exiting.');
      return report;
    }

    // 3. Auto-approve selected candidates
    const approvedCount = await autoApproveCandidates(supabase, selected);
    report.auto_approved_count = approvedCount;
    report.details.push(`Auto-approved: ${approvedCount} candidates (status → auto_approved).`);

    console.log(`[auto-fill] Auto-approved ${approvedCount} candidates.`);

    // 4. Schedule into challenges table
    const { scheduledCount, daysFilled, details } = await scheduleCandidates(
      supabase,
      selected,
      gaps
    );

    report.scheduled_count = scheduledCount;
    report.days_filled = daysFilled;
    report.details.push(...details);

    console.log(`[auto-fill] Scheduled ${scheduledCount} challenges across ${daysFilled} day(s).`);

    // 5. Re-check post-fill inventory
    const postCheck = await checkScheduleGaps(supabase);
    report.schedule_after = postCheck.totalScheduled;
    report.details.push(`Post-fill inventory: ${postCheck.totalScheduled} challenges.`);

    report.success = true;
    console.log(`[auto-fill] Complete. Before: ${totalScheduled}, After: ${postCheck.totalScheduled}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    report.errors.push(message);
    console.error(`[auto-fill] Error: ${message}`);
  }

  return report;
}
