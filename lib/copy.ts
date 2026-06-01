import type { GuessResult, RevealData } from './types';

export const copy = {
  onboarding: {
    label: 'daily challenge',
    title: 'UNCANNY',
    subtitle: 'Can you tell what is real?',
    ctaKicker: 'start',
    cta: 'Begin challenge',
  },

  gameplay: {
    commitPending: 'verifying',
    investigatePrompt: 'hold to look closer',
    decisionKicker: 'choose',
    real: 'Real',
    ai: 'AI',
    loading: "loading today's set",
    missing: 'challenge unavailable',
    socialTension: [
      'Most users failed here.',
      'Other players disagreed.',
      'People trusted the wrong details.',
      'This one caused hesitation.',
      'Something feels off.',
      'Most people changed their mind.',
      'Confidence dropped here.',
    ],
  },

  investigation: {
    fragments: [
      'Something feels slightly wrong.',
      'A subtle lighting detail.',
      'Look closer at the texture.',
      'Did a camera capture this?',
      'Other players hesitated here.',
      'An unnatural sharpness.',
    ],
  },

  reasoning: {
    tags: ['lighting', 'texture', 'too clean'] as const,
    label: 'what gave it away?',
  },

  reveal: {
    label: 'answer',
    real: 'This image was real.',
    ai: 'This image was AI.',
    timeout: 'No answer selected.',
    correct: 'Correct',
    wrong: 'Fooled',
    noConsensus: 'Users were split.',
    majorityAi: 'Most users thought this was AI.',
    majorityReal: 'Most users thought this was real.',
    split: 'Other players disagreed.',
    realOrigin: 'Real Photograph. Source verified.',
    aiOrigin: 'AI Image. Generated details.',
    unknownOrigin: 'Origin unverified.',
    networkFallback: 'Source unverified.',
  },

  speed: {
    impulsive: 'Your responses were near-instant. You relied on instinct over analysis.',
    deliberate: 'You took measured time before deciding. A careful player.',
    cautious: 'You lingered on most images. The uncertainty was visible.',
    hesitant: 'You hesitated significantly. The images held your attention too long.',
    earlyStrong: 'Your instincts were strongest early in the session.',
    lateSlow: 'Difficult images slowed your decisions.',
  },

  results: {
    label: "Today's Results",
    metric: 'accuracy',
    comparison: (comparison: number) => `You scored higher than ${comparison}% of players today.`,
    recurrence: (streak: number) => `streak ${streak}`,
    exposure: (time: string) => `time ${time}`,
    sample: 'Some images fooled most people.',
    misleading: 'most misleading image',
    misleadingNote: 'This image caused the biggest mistake in your run.',
    marks: 'your answers',
    selectedFrame: (index: number) => `question ${index + 1}`,
    input: 'your answer',
    sourceClass: 'correct answer',
    markLabel: 'result',
    unavailable: 'unavailable',
    reflections: [
      'You were completely misdirected.',
      'You trusted these images too quickly.',
      'People usually get this wrong.',
      'Most people missed this.',
      'Your perception was mostly stable.',
      'You noticed something others didn\'t.',
    ],
    mark: (result: GuessResult) => {
      if (result.guess === 'timeout') return 'skipped';
      return result.correct ? 'right' : 'wrong';
    },
  },

  cta: {
    export: 'Share results',
    exported: 'Copied',
    returnLater: 'Come back tomorrow.',
    restart: 'Restart test',
  },

  errors: {
    archiveUnavailable: 'Challenge unavailable.',
    signalInterrupted: 'Could not load challenge.',
    networkUnstable: 'Connection failed.',
    sourceUnresolved: 'source unavailable',
    imageUnavailable: 'image failed to load',
    imageUnavailableNote: 'Refresh and try again.',
  },
} as const;

export function socialTensionFor(seed: string, index: number): string {
  const value = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), index);
  return copy.gameplay.socialTension[value % copy.gameplay.socialTension.length];
}

export function revealConsensus(data: RevealData): string {
  const total = data.guesses_ai + data.guesses_real;
  if (total <= 0) return copy.reveal.noConsensus;

  const aiPercent = Math.round((data.guesses_ai / total) * 100);
  if (aiPercent > 64) return copy.reveal.majorityAi;
  if (aiPercent < 36) return copy.reveal.majorityReal;
  return copy.reveal.split;
}

export function revealOrigin(data: RevealData): string {
  if (data.answer === 'real') {
    return data.photographer_name || data.source_credit
      ? copy.reveal.realOrigin
      : copy.reveal.unknownOrigin;
  }

  return data.ai_prompt ? copy.reveal.aiOrigin : copy.reveal.unknownOrigin;
}

export function resultReflection(score: number): string {
  return copy.results.reflections[score] ?? copy.results.reflections[0];
}

// ── Speed Recognition ──
// Analyzes response timing across the session and returns a single
// quiet, observational sentence for the results screen.
export function speedObservation(results: GuessResult[], timerDuration: number): string {
  const validResults = results.filter(r => r.guess !== 'timeout');
  if (validResults.length === 0) return copy.speed.hesitant;

  const reactionTimes = validResults.map(r => timerDuration - r.timeRemaining);
  const avgReaction = reactionTimes.reduce((sum, t) => sum + t, 0) / reactionTimes.length;

  // Check if early responses were faster than late ones
  const half = Math.ceil(validResults.length / 2);
  const earlyTimes = reactionTimes.slice(0, half);
  const lateTimes = reactionTimes.slice(half);
  const earlyAvg = earlyTimes.reduce((s, t) => s + t, 0) / earlyTimes.length;
  const lateAvg = lateTimes.length > 0 ? lateTimes.reduce((s, t) => s + t, 0) / lateTimes.length : earlyAvg;

  // If early answers were notably faster, call that out
  if (earlyAvg < lateAvg - 2 && validResults.length >= 3) {
    return copy.speed.earlyStrong;
  }

  // If late answers were much slower, note the difficulty effect
  if (lateAvg > earlyAvg + 2.5 && validResults.length >= 3) {
    return copy.speed.lateSlow;
  }

  // Fall back to overall speed tier
  if (avgReaction < 2.5) return copy.speed.impulsive;
  if (avgReaction < 5) return copy.speed.deliberate;
  if (avgReaction < 8) return copy.speed.cautious;
  return copy.speed.hesitant;
}

// ── Reasoning Tag Insights ──
// Returns the most cited tag across the session, or null if < 2 tags selected.
export function reasoningInsight(results: GuessResult[]): string | null {
  const tags = results.map(r => r.reasoningTag).filter((t): t is string => !!t);
  if (tags.length < 2) return null;

  const counts: Record<string, number> = {};
  for (const tag of tags) {
    counts[tag] = (counts[tag] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topTag = sorted[0]?.[0];
  if (!topTag) return null;

  return `Most cited: ${topTag}`;
}

export function getDynamicTags(challengeId: string | undefined): string[] {
  const pool = [
    'lighting',
    'texture',
    'too clean',
    'shadows',
    'reflections',
    'geometry',
    'focus',
    'details',
    'sharpness',
    'colors',
    'patterns',
    'background',
    'proportions',
    'organic',
    'symmetry'
  ];

  if (!challengeId) {
    return ['lighting', 'texture', 'too clean'];
  }

  let hash = 0;
  for (let i = 0; i < challengeId.length; i++) {
    hash = challengeId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const selected: string[] = [];
  let tempHash = Math.abs(hash);

  while (selected.length < 3) {
    const idx = tempHash % pool.length;
    const tag = pool[idx];
    if (!selected.includes(tag)) {
      selected.push(tag);
    }
    tempHash = Math.floor(tempHash / pool.length) + 13;
  }

  return selected;
}

