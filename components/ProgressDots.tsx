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

        let dotColor = 'bg-muted/20';
        if (isPast && result.correct) dotColor = 'bg-muted';
        if (isPast && !result.correct) dotColor = 'bg-ai';
        if (isCurrent && !isPast) dotColor = 'bg-outline';

        return (
          <div
            key={i}
            className={`transition-all duration-300 ${dotColor} ${
              isCurrent ? 'w-3 h-3 dot-active' : 'w-2 h-2'
            }`}
          />
        );
      })}
    </div>
  );
}
