'use client';

import TopNav from './TopNav';
import BottomNav from './BottomNav';
import Link from 'next/link';

export default function ArchiveExhausted() {
  return (
    <main className="h-[100dvh] overflow-y-auto bg-background text-on-surface cinematic-bg selection:bg-on-surface selection:text-background flex flex-col">
      <div className="grain-overlay" />
      <TopNav />
      
      <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 md:px-16 pt-24 pb-48">
        {/* Background Atmospheric Layer */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-surface-container-low to-background opacity-40"></div>
          <div className="absolute inset-0 scanline-overlay"></div>
        </div>

        {/* Central Empty State Module */}
        <section className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center">
          {/* Metadata Header */}
          <div className="w-full flex justify-between items-end mb-8 border-b border-outline-variant pb-2 opacity-60">
            <span className="font-mono text-[10px] md:text-[12px] uppercase tracking-[0.2em] text-outline">PROTOCOL_NULL | BUFFER_CLEARED</span>
            <span className="font-mono text-[10px] md:text-[12px] uppercase tracking-[0.2em] text-outline">ID: 882-00-X</span>
          </div>

          {/* Large Empty Frame with Noise */}
          <div className="relative w-full aspect-[16/7] md:aspect-[21/9] border border-outline-variant mb-16 group overflow-hidden flex items-center justify-center">
            {/* Internal Corner Marks */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-outline opacity-40"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-outline opacity-40"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-outline opacity-40"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-outline opacity-40"></div>

            {/* Noise Texture Center */}
            <div className="w-32 h-32 md:w-48 md:h-48 border border-outline-variant flex items-center justify-center bg-surface-container-lowest relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 mix-blend-screen overflow-hidden">
                <img 
                  className="w-full h-full object-cover grayscale contrast-200" 
                  alt="Static noise texture" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKLGV9fJ2Vz1n0CuCDT70b-265Cv5Yr5lzsehFInmhn0u37lI2lmxQSyjhFEspBBNsTB37EdziSnUac9_S38YEcJzKF3OSITbPj71HLtRoCsuwuTvW8dP-kAS8yfwvgvjeD6HKZxMkcmRLLTcqJDSg0vmEg2NI8wBn7SFoQczJTkpPbtA_qh7Na7I0dbwGkZ-NX6cPcliD4jIU46yRmW9A4hW8MtvSRETme0Un7X_dIWSQ2VqIw7cLdJuR1RH6Hn7Ac1k-KfveL-r_"
                />
              </div>
              <span className="material-symbols-outlined text-outline text-4xl opacity-30" style={{ fontVariationSettings: "'wght' 100" }}>visibility_off</span>
            </div>

            {/* Subtle Tension Monospaced Text */}
            <div className="absolute bottom-8 w-full flex justify-center">
              <p className="font-mono text-xs uppercase text-outline tracking-[0.3em] opacity-40 animate-pulse">Something remains unobserved.</p>
            </div>
          </div>

          {/* Content Details */}
          <div className="max-w-xl mx-auto">
            <h2 className="font-sans text-4xl md:text-5xl uppercase tracking-tighter text-on-surface mb-6 font-bold">ARCHIVE_EXHAUSTED</h2>
            <p className="text-base text-outline-variant mb-12 leading-relaxed">
              Today&apos;s set is complete. The archive will refresh tomorrow.
            </p>

            {/* Action */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/profile" className="border border-outline px-12 py-4 font-mono text-xs uppercase tracking-[0.2em] hover:bg-on-surface hover:text-background transition-all duration-0 active:scale-95 inline-block">
                VIEW RECORD
              </Link>
              <Link href="/leaderboard" className="border border-outline-variant px-12 py-4 font-mono text-xs uppercase tracking-[0.2em] text-outline hover:text-on-surface transition-all duration-0 active:scale-95 inline-block">
                COMPARE OBSERVERS
              </Link>
            </div>
          </div>
          
          {/* Debug Reset Button */}
          <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity pb-24">
            <button 
              onClick={() => {
                localStorage.removeItem('uncanny_state');
                window.location.reload();
              }}
              className="font-mono text-[10px] text-error border border-error/50 px-4 py-2 uppercase tracking-widest"
            >
              DEBUG: RESET STATE
            </button>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
