'use client';

import Link from 'next/link';

interface TopNavProps {
  status?: string;
}

export default function TopNav({ status }: TopNavProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-16 py-4 bg-background border-b border-outline">
      <Link href="/" className="flex items-center gap-3 group">
        <span className="material-symbols-outlined text-primary group-hover:opacity-80 transition-opacity" style={{ fontVariationSettings: "'wght' 200" }}>fingerprint</span>
        <h1 className="font-sans text-2xl md:text-5xl font-bold text-primary uppercase tracking-[0.2em] leading-none">UNCANNY</h1>
      </Link>
      <div className="hidden md:flex gap-8 items-center">
        {status ? (
           <div className="font-mono text-xs text-outline uppercase tracking-[0.1em]">{status}</div>
        ) : (
          <>
            <div className="font-mono text-xs uppercase text-outline tracking-[0.1em]">PROTOCOL</div>
            <div className="font-mono text-xs uppercase text-outline tracking-[0.1em]">ACCESS_POINT</div>
          </>
        )}
      </div>
    </header>
  );
}
