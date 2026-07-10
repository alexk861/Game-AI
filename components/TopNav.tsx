'use client';

import Link from 'next/link';
import UncannyLogo from '@/components/UncannyLogo';

interface TopNavProps {
  status?: string;
}

export default function TopNav({ status }: TopNavProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-16 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 bg-background border-b border-border-dim">
      <Link href="/" className="flex items-center gap-3 group">
        <UncannyLogo size={24} className="group-hover:opacity-80 transition-opacity" />
        <h1 className="font-sans text-2xl md:text-5xl font-bold text-primary uppercase tracking-label leading-none">UNCANNY</h1>
      </Link>
      <div className="flex gap-6 md:gap-8 items-center">
        {status ? (
           <div className="font-mono text-label md:text-xs text-muted uppercase tracking-caps">{status}</div>
        ) : (
          <>
            <Link href="/profile" className="font-mono text-label md:text-xs uppercase text-muted/80 hover:text-on-surface active:text-on-surface tracking-caps transition-colors">
              PROFILE
            </Link>
            <Link href="/leaderboard" className="font-mono text-label md:text-xs uppercase text-muted/80 hover:text-on-surface active:text-on-surface tracking-caps transition-colors">
              RANKINGS
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
