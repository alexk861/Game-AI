import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { FALLBACK_CHALLENGES } from '@/lib/fallbackChallenges';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      challengeId,
      guess,
      decision_ms,
      isTimeout,
      guess_confidence,
      answer_change_count,
      investigation_duration_ms,
      unlockedReflection,
      clickedReplay,
      reflection_duration_ms
    } = body;

    if (!challengeId || !guess || !['ai', 'real'].includes(guess)) {
      return NextResponse.json(
        { error: 'Invalid request. Need challengeId and guess (ai|real).' },
        { status: 400 }
      );
    }

    // ── Fallback Challenge Matching Layer ──
    let challenge = null;
    let isFallback = false;

    // Find challenge in fallback structures
    for (const levelData of Object.values(FALLBACK_CHALLENGES)) {
      const match = levelData.find(c => c.id === challengeId);
      if (match) {
        challenge = match;
        isFallback = true;
        break;
      }
    }

    let updatedGuessesAi = 0;
    let updatedGuessesReal = 0;

    if (isFallback && challenge) {
      updatedGuessesAi = guess === 'ai' ? 1 : 0;
      updatedGuessesReal = guess === 'real' ? 1 : 0;
    } else {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: dbChallenge, error: fetchError } = await supabaseAdmin
        .from('challenges')
        .select('answer, image_url, context_short, ai_prompt, source_credit, photographer_name, photographer_url, unsplash_url, guesses_ai, guesses_real')
        .eq('id', challengeId)
        .single();

      if (fetchError || !dbChallenge) {
        console.error('Error fetching challenge for guess:', fetchError);
        return NextResponse.json(
          { error: 'Challenge not found' },
          { status: 404 }
        );
      }

      challenge = dbChallenge;

      const incrementField = guess === 'ai' ? 'guesses_ai' : 'guesses_real';
      const updatedCount = (challenge[incrementField] || 0) + 1;

      const { error: updateError } = await supabaseAdmin
        .from('challenges')
        .update({ [incrementField]: updatedCount })
        .eq('id', challengeId);

      if (updateError) {
        console.error('Error updating guess counter:', updateError);
      }

      updatedGuessesAi = guess === 'ai' ? updatedCount : (challenge.guesses_ai || 0);
      updatedGuessesReal = guess === 'real' ? updatedCount : (challenge.guesses_real || 0);

      // ── Advanced Telemetry Curation & Disagreement Layer ──
      if (dbChallenge.image_url) {
        try {
          const { data: candidate, error: candidateError } = await supabaseAdmin
            .from('content_candidates')
            .select('*')
            .eq('image_url', dbChallenge.image_url)
            .single();

          if (!candidateError && candidate) {
            const isCorrect = dbChallenge.answer === guess;
            const newServes = (candidate.total_served_count || 0) + 1;
            const newCorrect = (candidate.total_correct_count || 0) + (isCorrect ? 1 : 0);
            const newWrong = (candidate.total_wrong_count || 0) + (isCorrect ? 0 : 1);
            const newTimeout = (candidate.total_timeout_count || 0) + (isTimeout ? 1 : 0);

            // Average decision
            let newAvgDecision = candidate.average_decision_ms || 0;
            if (decision_ms !== undefined) {
              const prevDecisionTotal = (candidate.average_decision_ms || 0) * (candidate.total_served_count || 0);
              newAvgDecision = Math.round((prevDecisionTotal + decision_ms) / newServes);
            }

            // Guesses on challenge
            const finalRealGuesses = guess === 'real' ? (dbChallenge.guesses_real || 0) + 1 : (dbChallenge.guesses_real || 0);
            const finalAiGuesses = guess === 'ai' ? (dbChallenge.guesses_ai || 0) + 1 : (dbChallenge.guesses_ai || 0);
            const totalGuesses = finalRealGuesses + finalAiGuesses;
            const p = totalGuesses > 0 ? finalRealGuesses / totalGuesses : 0.5;
            const newDisagreement = 4 * p * (1 - p);
            const newConsensus = totalGuesses > 0 ? newCorrect / newServes : 0.5;

            // Reflection Unlocks
            const newReflectionUnlocks = (candidate.total_reflection_unlocks || 0) + (unlockedReflection ? 1 : 0);
            const newReflectionUnlockRate = newReflectionUnlocks / newServes;

            // Replays
            const newReplays = (candidate.total_replay_clicks || 0) + (clickedReplay ? 1 : 0);
            const newReplayInterest = newReplays / newServes;

            // Confidence sum and sq sum
            const confidenceInput = guess_confidence !== undefined ? Math.max(1, Math.min(5, guess_confidence)) : 3;
            const newConfidenceSum = Number(candidate.total_guess_confidence_sum || 0) + confidenceInput;
            const newConfidenceSqSum = Number(candidate.total_guess_confidence_sq_sum || 0) + (confidenceInput * confidenceInput);

            // Answer change
            const changesInput = answer_change_count !== undefined ? Math.max(0, answer_change_count) : 0;
            const newAnswerChanges = Number(candidate.total_answer_change_count || 0) + changesInput;

            // Investigation duration
            const investigationInput = investigation_duration_ms !== undefined ? Math.max(0, investigation_duration_ms) : 0;
            const newInvestigationDuration = Number(candidate.total_investigation_duration_ms || 0) + investigationInput;

            // Reflection duration
            const reflectionDurInput = reflection_duration_ms !== undefined ? Math.max(0, reflection_duration_ms) : 0;
            const newReflectionDuration = Number(candidate.total_reflection_duration_ms || 0) + reflectionDurInput;
            const newAvgReflectionDuration = Math.round(newReflectionDuration / newServes);

            // Calculate variance
            const avgConfidence = newConfidenceSum / newServes;
            const newConfidenceVariance = Math.max(0, (newConfidenceSqSum / newServes) - (avgConfidence * avgConfidence));

            // Evolve metrics payload for decay and slow burn scores
            const metricsPayload = {
              total_served_count: newServes,
              total_correct_count: newCorrect,
              total_wrong_count: newWrong,
              total_timeout_count: newTimeout,
              average_decision_ms: newAvgDecision,
              disagreement_score: newDisagreement,
              consensus_confidence: newConsensus,
              reflection_unlock_rate: newReflectionUnlockRate,
              replay_interest_score: newReplayInterest,
              total_answer_change_count: newAnswerChanges,
              curator_locked: !!candidate.curator_locked,
              anomaly_tier: candidate.anomaly_tier || 0
            };

            // Compute scores using decay engine
            const { calculateSlowBurnScore, calculateDecayScore, shouldRetireCandidate } = require('@/lib/decayEngine');
            const newSlowBurn = calculateSlowBurnScore(metricsPayload);
            const newDecay = calculateDecayScore(metricsPayload);

            // Handle retirement status
            let newStatus = candidate.status;
            if (shouldRetireCandidate(metricsPayload)) {
              newStatus = 'deleted';
            }

            // Save back to content_candidates
            await supabaseAdmin
              .from('content_candidates')
              .update({
                total_served_count: newServes,
                total_correct_count: newCorrect,
                total_wrong_count: newWrong,
                total_timeout_count: newTimeout,
                average_decision_ms: newAvgDecision,
                disagreement_score: newDisagreement,
                consensus_confidence: newConsensus,
                suspicion_accuracy: newConsensus, // Identical to consensus confidence
                total_reflection_unlocks: newReflectionUnlocks,
                reflection_unlock_rate: newReflectionUnlockRate,
                total_replay_clicks: newReplays,
                replay_interest_score: newReplayInterest,
                total_guess_confidence_sum: newConfidenceSum,
                total_guess_confidence_sq_sum: newConfidenceSqSum,
                total_answer_change_count: newAnswerChanges,
                total_investigation_duration_ms: newInvestigationDuration,
                total_reflection_duration_ms: newReflectionDuration,
                average_reflection_duration_ms: newAvgReflectionDuration,
                confidence_variance_score: newConfidenceVariance,
                slow_burn_score: newSlowBurn,
                candidate_decay_score: newDecay,
                status: newStatus
              })
              .eq('id', candidate.id);
          }
        } catch (telemetryErr) {
          console.error('[guess-api] Advanced telemetry calculation error:', telemetryErr);
        }
      }
    }

    return NextResponse.json({
      correct: challenge.answer === guess,
      answer: challenge.answer,
      context_short: challenge.context_short,
      ai_prompt: challenge.ai_prompt,
      source_credit: challenge.source_credit,
      photographer_name: challenge.photographer_name,
      photographer_url: challenge.photographer_url,
      unsplash_url: challenge.unsplash_url,
      guesses_ai: updatedGuessesAi,
      guesses_real: updatedGuessesReal,
    });
  } catch (error) {
    console.error('[guess-api] Internal server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

