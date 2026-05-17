'use client';

interface ProgressDotsProps {
  total: number;
  current: number;
  results: Array<{ correct: boolean } | null>; // null = not yet played
}

export default function ProgressDots({ total, current, results }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const result = results[i];
        const isCurrent = i === current;
        const isPast = result !== null && result !== undefined;

        let dotColor = 'bg-white/20'; // future
        if (isPast && result.correct) dotColor = 'bg-correct';
        if (isPast && !result.correct) dotColor = 'bg-wrong';
        if (isCurrent && !isPast) dotColor = 'bg-white';

        return (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${dotColor} ${
              isCurrent ? 'w-3 h-3 dot-active' : 'w-2 h-2'
            }`}
          />
        );
      })}
    </div>
  );
}
