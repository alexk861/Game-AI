import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';

export default function Profile() {
  return (
    <main className="min-h-[100dvh] bg-background text-on-surface selection:bg-on-surface selection:text-background flex flex-col">
      <div className="grain-overlay"></div>
      
      {/* Background Visual */}
      <div 
        className="fixed inset-0 z-0 opacity-20 filter grayscale contrast-150 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(19, 19, 19, 0) 0%, rgba(19, 19, 19, 1) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBxH5D61Vgh3_nZmzO3bxlVJL2_CIfWIvG4WnOyhkXTIOIEP8gukoefTVVgFDbWU6glJY9Ra6L55bYHyxF8u3dsBDGhaRYUmolZsQDzJIAosU5PPLqqBKn62U2WoloGfjkZwcfqZuo4G4Lu9gQf-GdsZj72cxiOG10D2ihLAtCGuyHlN_sXqPVXu80qezR4-EBl9pR5IOg8U7bo8BnvMXhJHWQjn8pODrFCAOPfGcbMc8b2s5QfUCTJpyLi9XPo4hlVvW2WxbkVhmbI")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>

      <TopNav />

      <div className="relative z-10 pt-32 pb-40 px-6 md:px-16 max-w-4xl mx-auto w-full">
        {/* Profile Header */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline pb-8">
            <div>
              <p className="font-mono text-xs text-outline mb-2">OBSERVER RECORD</p>
              <h2 className="font-sans text-4xl md:text-5xl font-bold uppercase tracking-tighter">OBSERVER_884-A</h2>
            </div>
            <div className="font-mono text-xs text-outline flex gap-4">
              <span>ST-556 / REDACTED</span>
              <span>ACTIVE SIGNAL</span>
            </div>
          </div>
        </section>

        {/* Section 1: Perception Stats */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-px bg-outline">
          <div className="bg-background p-8 flex flex-col justify-between aspect-video md:aspect-square">
            <p className="font-mono text-xs text-outline uppercase">DRIFT RATE</p>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-5xl md:text-6xl font-bold">18%</span>
              <span className="material-symbols-outlined text-error text-sm">trending_up</span>
            </div>
            <p className="text-sm text-outline-variant">Deviation from objective consensus within the last 72 hours of sensory feed analysis.</p>
          </div>
          <div className="bg-background p-8 flex flex-col justify-between aspect-video md:aspect-square">
            <p className="font-mono text-xs text-outline uppercase">CALIBRATION STREAK</p>
            <div className="font-sans text-5xl md:text-6xl font-bold uppercase">12 DAYS</div>
            <div className="h-1 w-full bg-surface-container mt-auto">
              <div className="h-full bg-on-surface w-3/4"></div>
            </div>
          </div>
        </section>

        {/* Section 2: Behavioral Profile */}
        <section className="mb-20">
          <div className="border border-outline p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h3 className="font-sans text-2xl font-bold uppercase tracking-tight">BEHAVIORAL PROFILE</h3>
            </div>
            <div className="space-y-6">
              <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant italic">
                &quot;Tendency to over-classify as AI in low-light scenarios. Sensory bias detected. Subject exhibits heightened suspicion towards biological imperfections, often misinterpreting organic textures as generative noise.&quot;
              </p>
              <div className="pt-6 border-t border-outline-variant flex flex-wrap gap-4">
                <span className="px-4 py-1 border border-outline-variant font-mono text-[10px] uppercase">Hyper-vigilant</span>
                <span className="px-4 py-1 border border-outline-variant font-mono text-[10px] uppercase">Static-sensitive</span>
                <span className="px-4 py-1 border border-outline-variant font-mono text-[10px] uppercase">Pattern-seeking</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Most Misleading Subject */}
        <section className="mb-20">
          <h3 className="font-mono text-xs text-outline uppercase mb-6">CRITICAL ANOMALY DETECTED</h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 aspect-square border border-outline relative overflow-hidden group">
              <img 
                alt="Unstable Classification Image" 
                className="w-full h-full object-cover grayscale brightness-75 group-hover:brightness-100 transition-all duration-700" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgIIghwst1NmdfGq2LHF4RQ7vGrCHuymsWOWR1WNfSmGbaKhflqf61x28655rpSJ1iEbthh52i-5U0lFAi_BSJBD7fhvzJzJxP3Ox7CxSBd3FMNDcm3J8SDh_Tz_N51vlxjQLYO-B3l-ry9yXss1_ye5udC8pgJHm6H-JXiyzWJPetEv6otcdgKEUCRUntiLMQxWjihxsb7jPbEzhur1vtBqiQVgES0U7nfzdMDcAyB2evdkgZXScvxAligQNy_8365R1TXCZiGAsL"
              />
              <div className="absolute inset-0 bg-error/10 mix-blend-overlay"></div>
            </div>
            <div className="md:col-span-7 flex flex-col justify-center h-full py-4">
              <span className="font-mono text-xs text-error mb-4 block">UNSTABLE CLASSIFICATION</span>
              <p className="font-sans text-2xl font-bold mb-4 uppercase">CASE_REF: 039-X</p>
              <p className="text-outline mb-8 max-w-md">Observer 884-A misidentified this subject as &quot;NON-BIOLOGICAL&quot; with 94% confidence. Correct classification: HUMAN [DECEASED].</p>
              <button className="self-start border border-outline px-12 py-4 font-mono text-xs uppercase hover:bg-on-surface hover:text-background transition-colors duration-0 active:scale-95">
                RE-EXAMINE
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Recent Logs */}
        <section>
          <div className="flex items-center justify-between border-b border-outline pb-4 mb-4">
            <h3 className="font-mono text-xs text-outline uppercase">RECENT OBSERVATION LOGS</h3>
            <span className="font-mono text-[10px] text-outline-variant">TOTAL_RECORDS: 142</span>
          </div>
          <div className="divide-y divide-outline-variant">
            <div className="py-6 flex items-center justify-between group hover:px-4 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-8">
                <span className="font-mono text-xs text-outline">01</span>
                <span className="font-sans text-sm md:text-base font-semibold uppercase tracking-widest">CASE 041</span>
              </div>
              <div className="flex items-center gap-12">
                <span className="font-mono text-xs text-primary">80% ACCURACY</span>
                <span className="material-symbols-outlined text-outline group-hover:text-on-surface">chevron_right</span>
              </div>
            </div>
            
            <div className="py-6 flex items-center justify-between group hover:px-4 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-8">
                <span className="font-mono text-xs text-outline">02</span>
                <span className="font-sans text-sm md:text-base font-semibold uppercase tracking-widest">CASE 040</span>
              </div>
              <div className="flex items-center gap-12">
                <span className="font-mono text-xs text-error">60% ACCURACY</span>
                <span className="material-symbols-outlined text-outline group-hover:text-on-surface">chevron_right</span>
              </div>
            </div>

            <div className="py-6 flex items-center justify-between group hover:px-4 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-8">
                <span className="font-mono text-xs text-outline">03</span>
                <span className="font-sans text-sm md:text-base font-semibold uppercase tracking-widest">CASE 039</span>
              </div>
              <div className="flex items-center gap-12">
                <span className="font-mono text-xs text-primary">92% ACCURACY</span>
                <span className="material-symbols-outlined text-outline group-hover:text-on-surface">chevron_right</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
