'use client';

import { useState } from 'react';
import ContentGenerator from '@/components/nano-banana/ContentGenerator';
import CandidateList from '@/components/nano-banana/CandidateList';
import type { GeneratedCandidate } from '@/lib/nano-banana/types';

export default function NanoBananaPage() {
  const [candidates, setCandidates] = useState<GeneratedCandidate[]>([]);

  const handleGenerated = (newCandidates: GeneratedCandidate[]) => {
    setCandidates(prev => [...newCandidates, ...prev]);
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Nano Banana</h1>
        <p className="text-muted-foreground">
          AI-powered content generation and curation for the Uncanny Valley game.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <ContentGenerator onGenerated={handleGenerated} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Generated Candidates</h2>
          <CandidateList candidates={candidates} />
        </section>
      </div>
    </div>
  );
}
