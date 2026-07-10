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
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-stretch pb-[env(safe-area-inset-bottom)] h-[calc(env(safe-area-inset-bottom)+5rem)] bg-background border-t border-outline">
      <Link 
        href="/" 
        className={`flex flex-col items-center justify-center pt-3 pb-2 w-full transition-all duration-300 ${isActive('/') ? 'text-foreground' : 'text-muted/80 hover:text-foreground'}`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/') ? "'wght' 300, 'FILL' 1" : "'wght' 200, 'FILL' 0" }}>grid_view</span>
        <span className="font-mono text-label sm:text-label-lg uppercase tracking-label">TODAY</span>
      </Link>
      
      <Link 
        href="/leaderboard" 
        className={`flex flex-col items-center justify-center pt-3 pb-2 w-full transition-all duration-300 ${isActive('/leaderboard') ? 'text-foreground' : 'text-muted/80 hover:text-foreground'}`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/leaderboard') ? "'wght' 300, 'FILL' 1" : "'wght' 200, 'FILL' 0" }}>insights</span>
        <span className="font-mono text-label sm:text-label-lg uppercase tracking-label">RANKINGS</span>
      </Link>
      
      <Link 
        href="/profile" 
        className={`flex flex-col items-center justify-center pt-3 pb-2 w-full transition-all duration-300 ${isActive('/profile') ? 'text-foreground' : 'text-muted/80 hover:text-foreground'}`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/profile') ? "'wght' 300, 'FILL' 1" : "'wght' 200, 'FILL' 0" }}>person</span>
        <span className="font-mono text-label sm:text-label-lg uppercase tracking-label">PROFILE</span>
      </Link>
    </nav>
  );
}
