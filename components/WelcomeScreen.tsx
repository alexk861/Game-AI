'use client';

import { copy, socialTensionFor } from '@/lib/copy';
import TopNav from '@/components/TopNav';
import UncannyLogo from '@/components/UncannyLogo';
import StatTile from '@/components/StatTile';
import {
  TIMER_DURATION_SECONDS,
  TOTAL_DAILY_CHALLENGES,
  puzzleNumberFor,
} from '@/lib/gameConfig';
import { useSearchParams } from 'next/navigation';

interface WelcomeScreenProps {
  onBegin: () => void;
  zenMode: boolean;
  setZenMode: (val: boolean) => void;
  isChallengePlay?: boolean;
  streak?: number;
}

export default function WelcomeScreen({ onBegin, zenMode, setZenMode, isChallengePlay = false, streak = 0 }: WelcomeScreenProps) {
  const searchParams = useSearchParams();
  const rawChallengerName = searchParams ? searchParams.get('ref') : null;
  const challengerName = rawChallengerName ? rawChallengerName.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 20) : null;
  const challengerScoreStr = searchParams ? searchParams.get('score') : null;
  const parsedScore = challengerScoreStr ? parseInt(challengerScoreStr, 10) : null;
  const challengerScore = (parsedScore !== null && !isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 5) ? parsedScore : null;

  const todayDate = new Date().toISOString().split('T')[0];
  const dayNumber = puzzleNumberFor(todayDate);
  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase();

  return (
    <main className="min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-background text-foreground scroll-smooth relative">
      <div className="noise-overlay" />
      <TopNav />
      <section className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-8 pb-[calc(env(safe-area-inset-bottom)+4rem)] pt-[env(safe-area-inset-top)]">
        <div className="mb-auto pt-20 flex flex-col items-start gap-8 fade-in">
          <UncannyLogo size={60} />
          <div className="font-mono text-label uppercase tracking-kicker text-muted/90">
            {copy.intro.dayLabel(dayNumber)} · {dateLabel}
          </div>
        </div>

        <div className="max-w-sm fade-in">
          <h1 className="text-display font-sans font-light tracking-wide text-foreground">
            {copy.onboarding.title}
          </h1>
          <p className="mt-5 max-w-[17rem] text-lg font-sans font-light leading-snug text-muted">
            {copy.onboarding.subtitle}
          </p>

          {isChallengePlay && (
            <div className="mt-8 border border-wrong/40 bg-wrong/5 p-4 font-sans">
              <div className="font-mono text-label uppercase tracking-label text-wrong mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-wrong animate-pulse" />
                // Incoming Challenge
              </div>
              {challengerName && challengerScore !== null ? (
                <>
                  <p className="text-sm font-sans font-light leading-relaxed text-foreground/95">
                    <span className="font-semibold text-foreground">{challengerName}</span> challenged you. They scored <span className="font-mono font-medium text-foreground">{challengerScore}/5</span>.
                  </p>
                  <p className="mt-1.5 text-label-lg font-sans font-light text-muted">
                    Can you beat this set?
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-sans font-light leading-relaxed text-foreground/95">
                    A friend challenged you.
                  </p>
                  <p className="mt-1.5 text-label-lg font-sans font-light text-muted">
                    Can you beat this set?
                  </p>
                </>
              )}
            </div>
          )}

          {!isChallengePlay && (
            <div className="mt-8 grid grid-cols-3 gap-px bg-border-dim border border-border-dim fade-in">
              <StatTile value={String(TOTAL_DAILY_CHALLENGES)} label={copy.intro.statImages} />
              <StatTile value={`${TIMER_DURATION_SECONDS}`} label={copy.intro.statSeconds} />
              <StatTile value="1" label={copy.intro.statTries} />
            </div>
          )}

          {!isChallengePlay && streak > 0 && (
            <div className="mt-6 flex items-center gap-3 font-mono text-label uppercase tracking-label text-muted">
              <span>{copy.intro.streak(streak)}</span>
              <span className="flex items-center gap-1" aria-hidden="true">
                {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                  <span key={i} className="block h-1.5 w-1.5 bg-outline" />
                ))}
              </span>
            </div>
          )}

          {/* Editorial Statement */}
          <div className="mt-12 border-t border-border-dim pt-8 space-y-4 fade-in">
            <p className="text-sm leading-relaxed text-foreground/95 font-sans font-light tracking-wide max-w-xs">
              Five daily images. Some are real photographs; others are AI-generated. You have twelve seconds for each.
            </p>
            <p className="font-mono text-label uppercase tracking-label text-muted/95 pt-1">
              {socialTensionFor(todayDate, 0)}
            </p>
          </div>

          <button
            type="button"
            onClick={onBegin}
            className="mt-12 w-full min-h-14 bg-primary text-background py-4 px-6 text-center font-mono text-label-lg font-medium uppercase tracking-caps transition-all duration-300 ease-out hover:bg-primary/95 active:bg-primary/90 active:scale-[0.99] cursor-pointer"
          >
            {isChallengePlay ? copy.onboarding.cta : copy.intro.play}
          </button>

        </div>
      </section>
    </main>
  );
}
