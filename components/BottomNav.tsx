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
        className={`flex flex-col items-center justify-center pt-3 pb-2 w-full transition-all duration-300 ${isActive('/') ? 'text-foreground' : 'text-outline hover:text-foreground'}`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/') ? "'wght' 300, 'FILL' 1" : "'wght' 200, 'FILL' 0" }}>grid_view</span>
        <span className="font-mono text-[10px] sm:text-[12px] uppercase tracking-[0.15em]">TODAY</span>
      </Link>
      
      <Link 
        href="/leaderboard" 
        className={`flex flex-col items-center justify-center pt-3 pb-2 w-full transition-all duration-300 ${isActive('/leaderboard') ? 'text-foreground' : 'text-outline hover:text-foreground'}`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/leaderboard') ? "'wght' 300, 'FILL' 1" : "'wght' 200, 'FILL' 0" }}>insights</span>
        <span className="font-mono text-[10px] sm:text-[12px] uppercase tracking-[0.15em]">INDEX</span>
      </Link>
      
      <Link 
        href="/profile" 
        className={`flex flex-col items-center justify-center pt-3 pb-2 w-full transition-all duration-300 ${isActive('/profile') ? 'text-foreground' : 'text-outline hover:text-foreground'}`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/profile') ? "'wght' 300, 'FILL' 1" : "'wght' 200, 'FILL' 0" }}>person</span>
        <span className="font-mono text-[10px] sm:text-[12px] uppercase tracking-[0.15em]">RECORD</span>
      </Link>
    </nav>
  );
}
