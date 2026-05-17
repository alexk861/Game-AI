import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';

export default function Leaderboard() {
  return (
    <main className="min-h-[100dvh] bg-background text-on-surface selection:bg-primary selection:text-background flex flex-col">
      {/* Background Layers */}
      <div className="grain-overlay pointer-events-none z-0"></div>
      <div className="scanline-overlay pointer-events-none z-0"></div>

      <TopNav />

      {/* Main Canvas */}
      <div className="relative z-10 flex-grow pt-32 pb-32 px-6 md:px-16 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <section className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8 border-l border-outline pl-8">
          <div>
            <span className="font-mono text-xs text-outline uppercase tracking-[0.2em] mb-2 block">System // Registry</span>
            <h2 className="font-sans text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-none">OBSERVER_INDEX</h2>
          </div>
          <div className="flex flex-col gap-2 md:text-right">
            <div className="font-mono text-xs text-primary flex items-center md:justify-end gap-2">
              <span className="w-2 h-2 bg-primary animate-pulse"></span>
              DAILY ARCHIVE STATUS: 94% SYNCED
            </div>
            <div className="font-mono text-xs text-outline">
              GLOBAL CONSENSUS FAILURE RATE: 42%
            </div>
          </div>
        </section>

        {/* Observer Table */}
        <section className="w-full">
          <div className="grid grid-cols-12 gap-0 border-t border-outline">
            {/* Table Header */}
            <div className="col-span-12 grid grid-cols-12 py-6 border-b border-outline bg-surface-container-low px-4">
              <div className="col-span-1 font-mono text-xs text-outline">NO.</div>
              <div className="col-span-5 font-mono text-xs text-outline">IDENTITY</div>
              <div className="col-span-3 font-mono text-xs text-outline text-right">DRIFT</div>
              <div className="col-span-3 font-mono text-xs text-outline text-right">STABILITY</div>
            </div>

            {/* Row 01 */}
            <div className="col-span-12 grid grid-cols-12 py-8 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-1 font-mono text-xs text-outline group-hover:text-background">01</div>
              <div className="col-span-5 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background">OBS_001</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">0.002%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-primary">OPTIMAL</div>
            </div>

            {/* Row 02 (User Highlighted) */}
            <div className="col-span-12 grid grid-cols-12 py-10 border-b-2 border-primary bg-surface-container px-4 relative">
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary"></div>
              <div className="col-span-1 font-mono text-xs text-primary font-bold">02</div>
              <div className="col-span-5 flex flex-col gap-1">
                <div className="font-sans text-xl md:text-2xl font-semibold uppercase text-on-surface">OBS_094 [YOU]</div>
                <span className="font-mono text-[10px] text-outline uppercase tracking-widest italic">Signal verification pending...</span>
              </div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-primary">0.142%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center text-on-surface">NOMINAL</div>
            </div>

            {/* Row 03 */}
            <div className="col-span-12 grid grid-cols-12 py-8 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-1 font-mono text-xs text-outline group-hover:text-background">03</div>
              <div className="col-span-5 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background">OBS_884</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">1.849%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-error">DEGRADING</div>
            </div>

            {/* Row 04 */}
            <div className="col-span-12 grid grid-cols-12 py-8 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-1 font-mono text-xs text-outline group-hover:text-background">04</div>
              <div className="col-span-5 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background">OBS_212</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">4.921%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-error">CRITICAL</div>
            </div>

            {/* Row 05 */}
            <div className="col-span-12 grid grid-cols-12 py-8 border-b border-outline px-4 hover:bg-on-surface group transition-all duration-0 cursor-default">
              <div className="col-span-1 font-mono text-xs text-outline group-hover:text-background">05</div>
              <div className="col-span-5 font-sans text-xl md:text-2xl font-semibold uppercase group-hover:text-background">OBS_559</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background">--.---%</div>
              <div className="col-span-3 font-mono text-xs text-right self-center group-hover:text-background text-outline">UNKNOWN</div>
            </div>
          </div>
        </section>

        {/* Narrative Visual Section */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="aspect-video border border-outline relative overflow-hidden group">
            <img 
              className="w-full h-full object-cover grayscale opacity-50 group-hover:scale-105 transition-transform duration-1000" 
              alt="Satellite network array floating in deep space" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPRGk9rEkRcqSZP9dpqle6PpCLvtU1j8H69Q5EE_0Pj7Xnh2ZdxUxhnGgo41e9OgCPme3NK3OwzA_tBh52B6hEfJdc9XGadjBudF057FPmyd7pVkGUHWGueCm4YGdg9ieDJHopIDy1qQ0uYoMWQd0r_ZaARlK-BkgjBORohbLubnJ-r0UrnCcwsJZiFag9nTgojx6366p2OvfdyhXzcg-p7ncXsSvIukN_WpDg8aSwEcLgiru9VQegbSYMlNLZFhx2-C-CQcnojbap"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            <div className="absolute bottom-4 left-4 font-mono text-[10px] text-primary tracking-[0.2em] uppercase">Visual Cluster // Node 04</div>
          </div>
          
          <div className="flex flex-col justify-center border-l border-outline pl-8">
            <p className="text-base text-outline mb-6 leading-relaxed">
              Participation in the UNCANNY collective requires absolute synchronization. Any drift exceeding 5.0% results in immediate index redaction. Stability is monitored via subcutaneous drift-markers. 
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="border border-outline px-8 py-3 font-mono text-xs uppercase tracking-[0.1em] hover:bg-on-surface hover:text-background transition-colors duration-0">
                RECALIBRATE
              </button>
              <button className="border border-outline px-8 py-3 font-mono text-xs uppercase tracking-[0.1em] hover:bg-on-surface hover:text-background transition-colors duration-0">
                VIEW_LOGS
              </button>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
