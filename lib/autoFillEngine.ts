// ── Uncanny Auto-Fill Engine ──
// Controlled content fallback for production stability.
// This is NOT full auto-publishing. This is a safety net.

import { SupabaseClient } from '@supabase/supabase-js';

// ─── Constants ───

const LOOKAHEAD_DAYS = 3;
const SAFETY_BUFFER = 15;
const MAX_AUTO_APPROVE = 12;
const SLOTS_PER_DAY = 5;

/** Auto-fill populates slots 1–3 (easy/medium real Unsplash content).
 *  Slots 4–5 are reserved for manual curation / harder content,
 *  but will be filled as fallback if inventory is critically low. */
const PRIMARY_SLOTS = [1, 2, 3];
const FALLBACK_SLOTS = [4, 5];

/** Difficulty distribution per set_order slot */
const SLOT_DIFFICULTY: Record<number, number> = {
  1: 1, // Easy
  2: 2, // Medium
  3: 3, // Hard
  4: 4, // Hard
  5: 5, // Extreme / controversial
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

/** Get the next N dates starting from tomorrow (UTC) */
function getUpcomingDates(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 1; i <= days; i++) {
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

  for (const date of dates) {
    const dayRows = (existing || []).filter(
      (r: { set_date: string; set_order: number }) => r.set_date === date
    );
    const filledSlots = dayRows.map(
      (r: { set_date: string; set_order: number }) => r.set_order
    );
    totalScheduled += filledSlots.length;

    // Find missing slots (1-9)
    const allSlots = Array.from({ length: SLOTS_PER_DAY }, (_, i) => i + 1);
    const missingSlots = allSlots.filter(s => !filledSlots.includes(s));

    if (missingSlots.length > 0) {
      gaps.push({ date, filledSlots, missingSlots });
    }
  }

  const requiredMinimum = SAFETY_BUFFER;
  const deficit = Math.max(0, requiredMinimum - totalScheduled);

  return { totalScheduled, gaps, deficit };
}

// ─── Step 2: Select Eligible Candidates ───

async function selectEligibleCandidates(
  supabase: SupabaseClient,
  limit: number = MAX_AUTO_APPROVE
): Promise<{
  selected: ContentCandidate[];
  skippedLowScore: number;
  skippedDuplicates: number;
  skippedNoAttribution: number;
}> {
  // 1. Get source_photo_ids already in challenges to prevent duplicates
  const { data: existingChallenges } = await supabase
    .from('challenges')
    .select('source_type, photographer_name, unsplash_url')
    .not('unsplash_url', 'is', null);

  const existingUnsplashUrls = new Set(
    (existingChallenges || [])
      .map((c: { unsplash_url: string | null }) => c.unsplash_url)
      .filter(Boolean)
  );

  // 2. Get all review candidates (broader query, filter in-app for precise control)
  const { data: allCandidates, error } = await supabase
    .from('content_candidates')
    .select('*')
    .eq('status', 'review')
    .not('image_url', 'is', null)
    .order('candidate_score', { ascending: false })
    .order('suspicious_score', { ascending: false })
    .limit(100); // Over-fetch for filtering

  if (error) {
    throw new Error(`Failed to fetch candidates: ${error.message}`);
  }

  let skippedLowScore = 0;
  let skippedDuplicates = 0;
  let skippedNoAttribution = 0;
  const selected: ContentCandidate[] = [];
  const usedCategories = new Set<string>();

  for (const candidate of allCandidates || []) {
    if (selected.length >= limit) break;

    // Quality gate — scoring system: candidateScore base=50 (0-100), suspiciousScore base=0 (0-100)
    // Accept anything with reasonable quality; most normal Unsplash photos score ~50/0
    if (candidate.candidate_score < 40) {
      skippedLowScore++;
      continue;
    }

    // Attribution gate
    if (!candidate.photographer_name) {
      skippedNoAttribution++;
      continue;
    }

    // Duplicate gate — check if source_photo_id is already used
    if (candidate.unsplash_url && existingUnsplashUrls.has(candidate.unsplash_url)) {
      skippedDuplicates++;
      continue;
    }

    // Diversity enforcement — avoid multiple images from the same category
    // within the same auto-fill batch (soft limit: max 3 per category)
    const cat = candidate.category || 'unknown';
    const catCount = [...selected].filter(s => s.category === cat).length;
    if (catCount >= 3) {
      continue; // Skip, try next candidate
    }

    selected.push(candidate as ContentCandidate);
    usedCategories.add(cat);
  }

  return { selected, skippedLowScore, skippedDuplicates, skippedNoAttribution };
}

// ─── Step 3: Auto-Approve Candidates ───

async function autoApproveCandidates(
  supabase: SupabaseClient,
  candidates: ContentCandidate[]
): Promise<number> {
  if (candidates.length === 0) return 0;

  const ids = candidates.map(c => c.id);

  const { error } = await supabase
    .from('content_candidates')
    .update({
      status: 'auto_approved',
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to auto-approve candidates: ${error.message}`);
  }

  return ids.length;
}

// ─── Step 4: Schedule Candidates into Challenges ───

async function scheduleCandidates(
  supabase: SupabaseClient,
  candidates: ContentCandidate[],
  gaps: ScheduleGap[]
): Promise<{ scheduledCount: number; daysFilled: number; details: string[] }> {
  if (candidates.length === 0 || gaps.length === 0) {
    return { scheduledCount: 0, daysFilled: 0, details: ['No candidates or gaps to fill.'] };
  }

  const details: string[] = [];
  let scheduledCount = 0;
  let daysFilled = 0;
  let candidateIndex = 0;

  // Sort candidates for strategic assignment
  // Highest suspicious_score first → reserved for Black Archive / hard slots
  const sortedByDifficulty = [...candidates].sort(
    (a, b) => b.suspicious_score - a.suspicious_score || b.candidate_score - a.candidate_score
  );

  // Separate pool: lower difficulty for easy slots, higher for hard slots
  const easyPool = candidates.filter(c => (c.difficulty_suggestion || 3) <= 2);
  const mediumPool = candidates.filter(c => (c.difficulty_suggestion || 3) === 3);
  const hardPool = candidates.filter(c => (c.difficulty_suggestion || 3) >= 4);

  // Track used candidate IDs to avoid double-assignment
  const usedIds = new Set<string>();
  // Track used categories per day for diversity
  const usedCategoriesPerDay = new Map<string, string[]>();

  function pickCandidate(
    pool: ContentCandidate[],
    dayDate: string,
    fallbackPool?: ContentCandidate[]
  ): ContentCandidate | null {
    const dayCategories = usedCategoriesPerDay.get(dayDate) || [];

    // Try primary pool first, then fallback
    for (const p of [pool, fallbackPool || []]) {
      for (const c of p) {
        if (usedIds.has(c.id)) continue;

        // Diversity: avoid same category appearing more than twice per day
        const catOccurrences = dayCategories.filter(cat => cat === c.category).length;
        if (catOccurrences >= 2) continue;

        return c;
      }
    }

    // Last resort: any unused candidate
    for (const c of candidates) {
      if (!usedIds.has(c.id)) return c;
    }

    return null;
  }

  function markUsed(c: ContentCandidate, dayDate: string) {
    usedIds.add(c.id);
    const cats = usedCategoriesPerDay.get(dayDate) || [];
    cats.push(c.category || 'unknown');
    usedCategoriesPerDay.set(dayDate, cats);
  }

  const rowsToInsert: Record<string, unknown>[] = [];

  for (const gap of gaps) {
    let daySlotsFilled = 0;

    // Determine which missing slots to fill.
    // Primary: fill slots 1-3 first (safe Unsplash real content).
    // Fallback: fill slots 4-9 only if still have candidates AND deficit is high.
    const primaryMissing = gap.missingSlots.filter(s => PRIMARY_SLOTS.includes(s));
    const fallbackMissing = gap.missingSlots.filter(s => FALLBACK_SLOTS.includes(s));

    // Always fill primary slots
    const slotsToFill = [...primaryMissing];

    // Fill fallback slots only if we still have candidates left
    if (candidates.length - usedIds.size > primaryMissing.length) {
      slotsToFill.push(...fallbackMissing);
    }

    for (const slot of slotsToFill) {
      if (usedIds.size >= candidates.length) break; // No more candidates
      if (candidateIndex >= MAX_AUTO_APPROVE) break; // Hard limit

      const targetDifficulty = SLOT_DIFFICULTY[slot] || 3;
      let picked: ContentCandidate | null = null;

      // Slot 9 = Black Archive: pick highest suspicious_score candidate
      if (slot === 9) {
        picked = pickCandidate(sortedByDifficulty, gap.date);
      } else if (targetDifficulty <= 2) {
        picked = pickCandidate(easyPool, gap.date, mediumPool);
      } else if (targetDifficulty === 3) {
        picked = pickCandidate(mediumPool, gap.date, hardPool);
      } else {
        picked = pickCandidate(hardPool, gap.date, mediumPool);
      }

      if (!picked) continue;

      // Generate context fallback
      const contextShort = picked.suggested_context
        || `A real photo from the ${picked.category || 'unknown'} category.`;

      rowsToInsert.push({
        set_date: gap.date,
        set_order: slot,
        image_url: picked.image_url,
        answer: 'real',
        difficulty: Math.min(5, Math.max(1, targetDifficulty)),
        context_short: contextShort,
        ai_prompt: null,
        source_credit: `Unsplash / ${picked.photographer_name}`,
        source_type: 'unsplash',
        photographer_name: picked.photographer_name,
        photographer_url: picked.photographer_url,
        unsplash_url: picked.unsplash_url,
        download_location: picked.download_location,
      });

      markUsed(picked, gap.date);
      candidateIndex++;
      daySlotsFilled++;
    }

    if (daySlotsFilled > 0) {
      daysFilled++;
      details.push(`${gap.date}: scheduled ${daySlotsFilled} challenges (slots: ${slotsToFill.filter(s => rowsToInsert.some(r => r.set_date === gap.date && r.set_order === s)).join(', ')})`);
    }
  }

  // Bulk insert — ON CONFLICT DO NOTHING to never overwrite manual content
  if (rowsToInsert.length > 0) {
    const { error } = await supabase
      .from('challenges')
      .upsert(rowsToInsert, {
        onConflict: 'set_date,set_order',
        ignoreDuplicates: true,
      });

    if (error) {
      throw new Error(`Failed to insert scheduled challenges: ${error.message}`);
    }

    scheduledCount = rowsToInsert.length;
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
    const { selected, skippedLowScore, skippedDuplicates, skippedNoAttribution } =
      await selectEligibleCandidates(supabase);

    report.skipped_low_score = skippedLowScore;
    report.skipped_duplicates = skippedDuplicates;
    report.skipped_no_attribution = skippedNoAttribution;
    report.details.push(`Candidates selected: ${selected.length} (skipped: ${skippedLowScore} low score, ${skippedDuplicates} duplicates, ${skippedNoAttribution} no attribution)`);

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
