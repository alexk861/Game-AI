// lib/contentScoring.ts

import { UnsplashPhoto } from './unsplash';

export interface ScoreResult {
  candidateScore: number;
  suspiciousScore: number;
  difficultySuggestion: number;
  suggestedContext: string;
}

/**
 * Score an Unsplash photo candidate based on its metadata and category.
 * Provides a difficulty suggestion (1-5) and a suggested context string.
 */
export function scoreUnsplashCandidate(photo: UnsplashPhoto, category: string): ScoreResult {
  let candidateScore = 50; // Base score
  let suspiciousScore = 0; // Likelihood of being mistaken for AI
  let difficultySuggestion = 3; // Default medium difficulty
  
  const description = (photo.description || photo.alt_description || '').toLowerCase();
  
  // 1. Evaluate description for keywords
  const aiKeywords = ['surreal', 'bizarre', 'unusual', 'strange', 'impossible', 'magic', 'dream', 'illusion', 'weird', 'liminal'];
  const realKeywords = ['nature', 'wildlife', 'cityscape', 'street', 'documentary', 'raw', 'unfiltered'];
  
  let keywordMatchCount = 0;
  for (const keyword of aiKeywords) {
    if (description.includes(keyword)) {
      suspiciousScore += 15;
      candidateScore += 10;
      difficultySuggestion += 1;
      keywordMatchCount++;
    }
  }
  
  for (const keyword of realKeywords) {
    if (description.includes(keyword)) {
      suspiciousScore -= 10;
    }
  }
  
  // 2. Adjust based on category
  const hardCategories = ['optical illusion', 'surreal landscape', 'liminal space'];
  if (hardCategories.includes(category.toLowerCase())) {
    difficultySuggestion += 1;
    suspiciousScore += 20;
    candidateScore += 15;
  }
  
  // 3. Normalize values
  difficultySuggestion = Math.max(1, Math.min(5, difficultySuggestion));
  candidateScore = Math.max(0, Math.min(100, candidateScore));
  suspiciousScore = Math.max(0, Math.min(100, suspiciousScore));
  
  // 4. Generate a suggested context based on the description or category
  let suggestedContext = '';
  if (photo.description) {
    // Trim to a reasonable length for context
    suggestedContext = photo.description.substring(0, 100) + (photo.description.length > 100 ? '...' : '');
  } else if (photo.alt_description) {
    suggestedContext = photo.alt_description.substring(0, 100) + (photo.alt_description.length > 100 ? '...' : '');
  } else {
    suggestedContext = `A real photo from the ${category} category.`;
  }
  
  return {
    candidateScore,
    suspiciousScore,
    difficultySuggestion,
    suggestedContext
  };
}
