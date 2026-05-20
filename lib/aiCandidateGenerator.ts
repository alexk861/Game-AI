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
  const AI_DAILY_GENERATION_TARGET = process.env.AI_DAILY_GENERATION_TARGET
    ? parseInt(process.env.AI_DAILY_GENERATION_TARGET, 10)
    : 20;
  const AI_MIN_BACKLOG = process.env.AI_MIN_BACKLOG
    ? parseInt(process.env.AI_MIN_BACKLOG, 10)
    : 20;
  const AI_HEALTHY_BACKLOG = process.env.AI_HEALTHY_BACKLOG
    ? parseInt(process.env.AI_HEALTHY_BACKLOG, 10)
    : 60;

  let currentBacklog = 0;
  let countToGenerate = options.requestedCount ?? 0;

  try {
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

    if (countError) {
      const details = [countError.message, countError.details, countError.hint, countError.code].filter(Boolean).join(' | ');
      throw new Error(`Backlog count query failed: ${details || JSON.stringify(countError)}`);
    }

    currentBacklog = count || 0;
  } catch (err) {
    console.error('Failed to query active AI backlog count:', err);
    currentBacklog = 0;
  }

  // Determine target counts if not manually specified
  if (!countToGenerate) {
    try {
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);

      const { count: generatedTodayCount, error: generatedTodayError } = await supabaseAdmin
        .from('content_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'nano_banana')
        .eq('source_type', 'ai_generated')
        .gte('created_at', startOfToday.toISOString());

      if (generatedTodayError) {
        throw generatedTodayError;
      }

      const generatedToday = generatedTodayCount || 0;

      if (currentBacklog < AI_MIN_BACKLOG) {
        // Rule A: Backlog below minimum
        countToGenerate = AI_DAILY_GENERATION_TARGET;
      } else if (currentBacklog < AI_HEALTHY_BACKLOG) {
        // Rule B: Backlog between min and healthy
        countToGenerate = Math.max(0, AI_DAILY_GENERATION_TARGET - generatedToday);
      } else {
        // Rule C: Healthy backlog
        countToGenerate = 0;
      }
    } catch (err) {
      console.error('Failed to evaluate daily generation capacity rules:', err);
      countToGenerate = currentBacklog < AI_MIN_BACKLOG ? AI_DAILY_GENERATION_TARGET : 0;
    }
  }

  if (countToGenerate <= 0) {
    return { message: 'Backlog is sufficient', generated: 0, requested: 0, current_backlog: currentBacklog };
  }

  let successCount = 0;
  try {
    const { data: realImages, error: realError } = await supabaseAdmin
      .from('content_candidates')
      .select('id, category, suggested_context')
      .or('answer.eq.real,answer.is.null')
      .in('status', ['approved', 'auto_approved'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (realError) throw new Error(`Real images query failed: ${realError.message}`);

    const prompts = await generatePromptsForImages(countToGenerate, realImages || []);

    for (const promptObj of prompts) {
      const {
        prompt,
        composition,
        emotion,
        lighting,
        perspective,
        scene,
        object,
        texture
      } = promptObj;

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
          composition_fingerprint: composition,
          emotional_fingerprint: emotion,
          lighting_fingerprint: lighting,
          perspective_fingerprint: perspective,
          scene_fingerprint: scene,
          object_fingerprint: object,
          texture_fingerprint: texture,
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
  } catch (err) {
    console.error('Fatal error or quota exceeded in AI Generation provider:', err);
    return {
      message: `Successfully generated ${successCount} out of ${countToGenerate} requested images before encountering provider/quota failure: ${err instanceof Error ? err.message : String(err)}`,
      generated: successCount,
      requested: countToGenerate,
      current_backlog: currentBacklog,
      error: true
    };
  }

  return {
    message: `Successfully generated ${successCount} out of ${countToGenerate} requested images.`,
    generated: successCount,
    requested: countToGenerate,
    current_backlog: currentBacklog,
  };
}
