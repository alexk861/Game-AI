// lib/decayEngine.ts

export interface CurationMetrics {
  total_served_count: number;
  total_correct_count: number;
  total_wrong_count: number;
  total_timeout_count: number;
  average_decision_ms: number;
  disagreement_score: number;
  consensus_confidence: number;
  reflection_unlock_rate: number;
  replay_interest_score: number;
  total_answer_change_count: number;
  curator_locked: boolean;
  anomaly_tier: number;
}

/**
 * Calculate slow-burn score.
 * Genuine ambiguity creates hesitation, low certainty, and high reflection/replay continuation.
 * Formula: slow_burn_score = D * (0.3 * TimeFactor + 0.3 * reflection_unlock_rate + 0.2 * replay_interest_score + 0.2 * HesitationFactor)
 */
export function calculateSlowBurnScore(metrics: CurationMetrics): number {
  const serves = Math.max(1, metrics.total_served_count);
  const D = metrics.disagreement_score;

  // 1. TimeFactor: Solved slowly (capped at 10s)
  const TimeFactor = Math.min(1.0, metrics.average_decision_ms / 10000);

  // 2. HesitationFactor: Toggles between options (average of 2 toggles is 100%)
  const avgChanges = metrics.total_answer_change_count / serves;
  const HesitationFactor = Math.min(1.0, avgChanges / 2.0);

  const slowBurn = D * (
    0.3 * TimeFactor +
    0.3 * metrics.reflection_unlock_rate +
    0.2 * metrics.replay_interest_score +
    0.2 * HesitationFactor
  );

  return Math.min(1.0, Math.max(0.0, slowBurn));
}

/**
 * Calculate candidate decay score.
 * Formula: decay = 0.40 * Predictability + 0.30 * SpeedPenalty + 0.20 * DisagreementLoss + 0.10 * LowEngagement
 */
export function calculateDecayScore(metrics: CurationMetrics): number {
  // 1. Predictability: Obvious AI or obvious Real (consensus confidence >= 90% or <= 10%)
  const Predictability = (metrics.consensus_confidence >= 0.90 || metrics.consensus_confidence <= 0.10) ? 1.0 : 0.0;

  // 2. SpeedPenalty: Solved in less than 1.5s
  const SpeedPenalty = Math.max(0.0, (1500 - metrics.average_decision_ms) / 1500);

  // 3. DisagreementLoss: High consensus means low disagreement
  const DisagreementLoss = 1.0 - metrics.disagreement_score;

  // 4. LowEngagement: Users do not unlock reflection
  const LowEngagement = 1.0 - metrics.reflection_unlock_rate;

  const decay = (
    0.40 * Predictability +
    0.30 * SpeedPenalty +
    0.20 * DisagreementLoss +
    0.10 * LowEngagement
  );

  return Math.min(1.0, Math.max(0.0, decay));
}

/**
 * Check if a candidate should be soft-retired.
 * Returns true if serves >= 15 and decay > 0.80, unless locked or anomaly tier 3.
 */
export function shouldRetireCandidate(metrics: CurationMetrics): boolean {
  if (metrics.curator_locked || metrics.anomaly_tier === 3) {
    return false; // Shielded from retirement
  }

  if (metrics.total_served_count < 15) {
    return false; // Not enough serves to decide
  }

  const decay = calculateDecayScore(metrics);
  return decay > 0.80;
}
