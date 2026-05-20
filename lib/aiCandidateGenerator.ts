import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { evaluateAIPromptStyle } from '@/lib/contentScoring';
import { generateImage, generatePromptsForImages, uploadGeneratedImageToStorage } from '@/lib/geminiImageClient';

const RATE_LIMIT_DELAY_MS = 5000;
const NANO_BANANA_MIN_BACKLOG = 35;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function recordGenerationRun(
  supabaseAdmin: SupabaseClient,
  run: {
    status: 'success' | 'failed';
    category: string;
    prompt_used?: string;
    error_message?: string;
    parent_real_candidate_id?: string;
  }
) {
  const { error } = await supabaseAdmin
    .from('ai_generation_runs')
    .insert({
      status: run.status,
      category: run.category,
      prompt_used: run.prompt_used ?? null,
      error_message: run.error_message ?? null,
      parent_real_candidate_id: run.parent_real_candidate_id ?? null,
    });

  if (error) {
    console.error('Failed to record AI generation run:', error.message);
  }
}

export async function generateAiCandidates(
  supabaseAdmin: SupabaseClient,
  options: { requestedCount?: number } = {}
) {
  const { count, error: countError } = await supabaseAdmin
    .from('content_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'nano_banana')
    .eq('source_type', 'ai_generated')
    .eq('answer', 'ai')
    .eq('safety_status', 'safe')
    .eq('auto_approve_eligible', true)
    .gte('candidate_score', 75)
    .gte('suspicious_score', 70)
    .in('status', ['review', 'approved', 'auto_approved']);

  if (countError) throw new Error(`Backlog count query failed: ${countError.message}`);

  const currentBacklog = count || 0;
  let countToGenerate = options.requestedCount ?? 0;

  if (!countToGenerate) {
    if (currentBacklog < NANO_BANANA_MIN_BACKLOG) countToGenerate = 20;
    else if (currentBacklog < 60) countToGenerate = 10;
  }

  if (countToGenerate <= 0) {
    return { message: 'Backlog is sufficient', generated: 0, requested: 0, current_backlog: currentBacklog };
  }

  const { data: realImages, error: realError } = await supabaseAdmin
    .from('content_candidates')
    .select('id, category, suggested_context')
    .or('answer.eq.real,answer.is.null')
    .in('status', ['approved', 'auto_approved'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (realError) throw new Error(`Real images query failed: ${realError.message}`);

  const prompts = await generatePromptsForImages(countToGenerate, realImages || []);
  let successCount = 0;

  for (const prompt of prompts) {
    const inspiration = (realImages || [])[successCount % Math.max(realImages?.length || 1, 1)];
    const category = inspiration?.category || 'generated';
    const parentId = inspiration?.id || null;

    try {
      const base64Image = await generateImage(prompt);
      const today = new Date().toISOString().split('T')[0];
      const seed = uuidv4();
      const filename = `${today}/${seed}.jpg`;
      const imageUrl = await uploadGeneratedImageToStorage(base64Image, filename);
      const styleEval = evaluateAIPromptStyle(prompt);
      const finalCandidateScore = Math.max(0, 85 - styleEval.stylePenalty);

      const { error: insertError } = await supabaseAdmin.from('content_candidates').insert({
        source: 'nano_banana',
        source_type: 'ai_generated',
        source_photo_id: `ai_gen_${seed}`,
        answer: 'ai',
        image_url: imageUrl,
        image_thumb_url: imageUrl,
        prompt_used: prompt,
        safety_status: 'safe',
        safety_flags: [],
        auto_approve_eligible: true,
        status: 'review',
        candidate_score: finalCandidateScore,
        suspicious_score: 80,
        category,
        parent_real_candidate_id: parentId,
        matched_real_category: category,
        suggested_context: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        generation_seed: seed,
        generation_model: process.env.NANO_BANANA_MODEL,
        generation_version: '1.0',
      });

      if (insertError) throw insertError;

      await recordGenerationRun(supabaseAdmin, {
        status: 'success',
        category,
        prompt_used: prompt,
        parent_real_candidate_id: parentId ?? undefined,
      });

      successCount++;
      await delay(RATE_LIMIT_DELAY_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Failed to generate/upload for prompt: ${prompt}`, err);
      await recordGenerationRun(supabaseAdmin, {
        status: 'failed',
        category,
        prompt_used: prompt,
        error_message: message,
        parent_real_candidate_id: parentId ?? undefined,
      });
      await delay(RATE_LIMIT_DELAY_MS);
    }
  }

  return {
    message: `Successfully generated ${successCount} out of ${countToGenerate} requested images.`,
    generated: successCount,
    requested: countToGenerate,
    current_backlog: currentBacklog,
  };
}
