'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="flex items-center gap-4">
      {/* Desktop inline navigation */}
      <nav className="hidden md:flex items-center gap-8 font-mono text-label-lg uppercase tracking-label text-muted">
        <Link href="/game" className="hover:text-foreground active:text-foreground transition-all">Play</Link>
        <a href="#how-it-works" className="hover:text-foreground active:text-foreground transition-all">How It Works</a>
        <a href="/uncanny-debug.apk" className="hover:text-foreground active:text-foreground transition-all">Download</a>
      </nav>

      {/* Mobile menu trigger */}
      <button
        onClick={toggleMenu}
        className="flex md:hidden items-center justify-center p-2 text-muted hover:text-foreground transition-all focus:outline-none z-[110] relative"
        aria-label="Toggle Menu"
      >
        {isOpen ? (
          // Close Icon
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          // Hamburger Icon
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="8" x2="20" y2="8"/>
            <line x1="4" y1="16" x2="20" y2="16"/>
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay - Rendered in document.body for absolute stacking freedom */}
      {isOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[45] bg-background backdrop-blur-xl flex flex-col justify-start pt-32 px-8 animate-[fadeIn_0.15s_ease-out]"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <nav className="flex flex-col gap-6 text-center">
            <Link 
              href="/game" 
              onClick={closeMenu}
              className="font-mono text-2xl uppercase tracking-label text-muted hover:text-foreground active:text-foreground py-4 border-b border-border-dim transition-all"
            >
              Play
            </Link>
            <a 
              href="#how-it-works" 
              onClick={closeMenu}
              className="font-mono text-2xl uppercase tracking-label text-muted hover:text-foreground active:text-foreground py-4 border-b border-border-dim transition-all"
            >
              How It Works
            </a>
            <a 
              href="/uncanny-debug.apk" 
              onClick={closeMenu}
              className="font-mono text-2xl uppercase tracking-label text-muted hover:text-foreground active:text-foreground py-4 border-b border-border-dim transition-all"
            >
              Download
            </a>
          </nav>
        </div>,
        document.body
      )}
    </div>
  );
}
