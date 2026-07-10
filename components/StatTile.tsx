'use client';

interface StatTileProps {
  value: string;
  label: string;
}

export default function StatTile({ value, label }: StatTileProps) {
  return (
    <div className="flex flex-col items-center gap-1 border border-border-dim bg-surface px-2 py-3 text-center">
      <span className="font-mono text-label-lg text-foreground">{value}</span>
      <span className="font-mono text-label uppercase tracking-label text-muted">{label}</span>
    </div>
  );
}
