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
    commitPending: 'checking answer',
    investigatePrompt: 'hold to look closer',
    decisionKicker: 'choose',
    real: 'Real',
    ai: 'AI',
    loading: 'loading challenge',
    missing: 'challenge unavailable',
    socialTension: [
      'Most users failed here.',
      'Human observers disagreed.',
      'People trusted the wrong details.',
      'This one caused hesitation.',
      'Something feels off.',
      'Most people changed their mind.',
      'Confidence dropped here.',
    ],
  },

  investigation: {
    fragments: [
      'EXIF: missing local timestamp',
      'compression seams detected',
      'reverse-search: REDACTED',
      'lighting anomaly in upper quadrant',
      'observer consensus breaking',
      'look closer',
    ],
  },

  reveal: {
    label: 'answer',
    real: 'This image was real.',
    ai: 'This image was AI.',
    timeout: 'No answer selected.',
    correct: 'You were right.',
    wrong: 'You were fooled.',
    noConsensus: 'Users were split.',
    majorityAi: 'Most users thought this was AI.',
    majorityReal: 'Most users thought this was real.',
    split: 'Human observers disagreed.',
    realOrigin: 'Real image. The source checked out.',
    aiOrigin: 'AI image. The clues were misleading.',
    unknownOrigin: 'Source details unavailable.',
    networkFallback: 'Could not verify the source.',
  },

  results: {
    label: 'results',
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
      'Human certainty collapsed.',
      'You trusted the wrong surfaces.',
      'Observer confidence degraded during analysis.',
      'You hesitated unusually long on organic patterns.',
      'Your perception remained mostly stable.',
      'You successfully isolated the anomalies.',
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
