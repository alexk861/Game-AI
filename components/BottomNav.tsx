'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/archive';
    }
    return pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-stretch h-20 bg-background border-t border-outline">
      <Link 
        href="/" 
        className={`flex flex-col items-center justify-center p-2 w-full transition-all duration-0 ${isActive('/') ? 'text-on-surface bg-surface-variant' : 'text-outline hover:bg-on-surface hover:text-background'}`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/') ? "'wght' 300, 'FILL' 1" : "'wght' 200, 'FILL' 0" }}>grid_view</span>
        <span className="font-mono text-[10px] sm:text-[12px] uppercase tracking-[0.15em]">ARCHIVE</span>
      </Link>
      
      <Link 
        href="/leaderboard" 
        className={`flex flex-col items-center justify-center p-2 w-full transition-all duration-0 ${isActive('/leaderboard') ? 'text-on-surface bg-surface-variant' : 'text-outline hover:bg-on-surface hover:text-background'}`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/leaderboard') ? "'wght' 300, 'FILL' 1" : "'wght' 200, 'FILL' 0" }}>insights</span>
        <span className="font-mono text-[10px] sm:text-[12px] uppercase tracking-[0.15em]">ANALYTICS</span>
      </Link>
      
      <Link 
        href="/profile" 
        className={`flex flex-col items-center justify-center p-2 w-full transition-all duration-0 ${isActive('/profile') ? 'text-on-surface bg-surface-variant' : 'text-outline hover:bg-on-surface hover:text-background'}`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/profile') ? "'wght' 300, 'FILL' 1" : "'wght' 200, 'FILL' 0" }}>person</span>
        <span className="font-mono text-[10px] sm:text-[12px] uppercase tracking-[0.15em]">OBSERVER</span>
      </Link>
    </nav>
  );
}
