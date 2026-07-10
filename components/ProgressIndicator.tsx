'use client';

interface ProgressIndicatorProps {
  total: number;
  current: number;
  results: Array<{ correct: boolean } | null>;
}

export default function ProgressIndicator({ total, current, results }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-3" aria-label={`Image ${current + 1} of ${total}`}>
      <span className="font-mono text-label-lg uppercase tracking-label text-muted">
        {current + 1} / {total}
      </span>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, index) => {
          const result = results[index];
          const isCurrent = index === current;
          const isPast = result !== null && result !== undefined;

          return (
            <span
              key={index}
              className={`block h-1.5 transition-all ${
                isCurrent
                  ? 'w-6 bg-foreground dot-active'
                  : isPast
                    ? result.correct
                      ? 'w-1.5 bg-real'
                      : 'w-1.5 bg-wrong'
                    : 'w-1.5 bg-border-dim'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
