import TopNav from '@/components/TopNav';
import Link from 'next/link';

export default function Login() {
  return (
    <main className="min-h-[100dvh] bg-background text-on-surface antialiased selection:bg-on-surface selection:text-background flex flex-col">
      {/* Atmospheric Overlays */}
      <div className="grain-overlay"></div>
      <div className="vignette"></div>

      {/* Background Texture/Image */}
      <div className="fixed inset-0 z-0 opacity-20 filter grayscale contrast-150 pointer-events-none">
        <img 
          className="w-full h-full object-cover" 
          alt="Brutalist concrete structure" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoCTIFeyQOD4143dQb3_b6nMSWLzFq8bR0JwTVyg4DoSBAdoO3GN4Em0qgMi74Xhmr7JFq3Bh9FFSQsA5FnzJHUc1PbmaxwsW3BI_r145u9e7EfEjdGh1X4dy7trI0rh7QLQKSqwHXiGxBBGTdiKgmkMlAKQT1UVVCVeB_rpGcPrKi03lH5pv0sHfCj-cORZYm67rdTtZvdP2AJNReVeE4l3T4i2QdPgca-orQf4O546k414HllqbLtquCS7FbehvjlHbYtCqxiw2Q"
        />
      </div>

      <TopNav status="SECURE_CONNECTION: ESTABLISHED" />

      {/* Main Content Canvas */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 md:px-16 pt-24 pb-24">
        <div className="w-full max-w-xl flex flex-col gap-12">
          {/* Headline Cluster */}
          <div className="flex flex-col items-center text-center gap-4">
            <h1 className="font-sans text-4xl md:text-5xl uppercase tracking-tighter text-on-surface font-bold">
              ENTRY_PROTOCOL
            </h1>
            <p className="text-base text-outline max-w-md">
              The archive requires an observer identity for calibration. 
              <span className="text-on-error opacity-80 block mt-2 text-[11px] font-mono tracking-widest uppercase">
                Unauthorised access to perception data is strictly monitored.
              </span>
            </p>
          </div>

          {/* Login Form Container */}
          <div className="flex flex-col gap-16 w-full">
            {/* Terminal Input */}
            <div className="group flex flex-col gap-2 w-full border-b border-outline focus-within:border-on-surface transition-colors">
              <label className="font-mono text-xs text-outline uppercase tracking-[0.2em] flex items-center gap-2" htmlFor="observer_id">
                <span className="text-[10px]">01</span> OBSERVER ID
              </label>
              <div className="flex items-center pb-2">
                <span className="font-mono text-outline mr-2">&gt;</span>
                <input 
                  className="bg-transparent border-none focus:ring-0 w-full font-mono text-on-surface placeholder:text-surface-variant p-0 outline-none" 
                  id="observer_id" 
                  name="observer_id" 
                  placeholder="ENTER_ID_KEY" 
                  type="text"
                />
                <div className="terminal-cursor"></div>
              </div>
            </div>

            {/* CTA Cluster */}
            <div className="flex flex-col gap-6 items-center">
              <button className="w-full h-16 border border-outline font-mono text-xs uppercase tracking-[0.3em] flex items-center justify-center transition-all duration-0 hover:bg-on-surface hover:text-background active:scale-[0.98]">
                INITIATE AUTHENTICATION
              </button>
              <Link className="font-mono text-[10px] text-outline uppercase tracking-widest hover:text-on-surface transition-colors border-b border-transparent hover:border-on-surface pb-1" href="/">
                PROCEED AS ANONYMOUS GUEST
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Metadata */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-6 border-t border-outline/30 bg-background/50 backdrop-blur-sm">
        <div className="font-mono text-[10px] text-outline uppercase tracking-[0.2em] flex gap-6">
          <span>LOG_884.A</span>
          <span className="hidden md:inline text-surface-variant">|</span>
          <span className="text-on-surface">STATUS: UNCALIBRATED</span>
          <span className="hidden md:inline text-surface-variant">|</span>
          <span>SIGNAL: STABLE</span>
        </div>
        <div className="mt-4 md:mt-0 font-mono text-[10px] text-outline opacity-50 uppercase tracking-[0.1em]">
          © UNCANNY_SYS // VER_0.9.4
        </div>
      </footer>

      {/* Decorative Elements */}
      <div className="fixed top-1/2 left-0 w-8 h-[1px] bg-outline/50 z-10 hidden md:block"></div>
      <div className="fixed top-1/2 right-0 w-8 h-[1px] bg-outline/50 z-10 hidden md:block"></div>
      <div className="fixed top-0 left-1/2 w-[1px] h-8 bg-outline/50 z-10 hidden md:block"></div>
      <div className="fixed bottom-0 left-1/2 w-[1px] h-8 bg-outline/50 z-10 hidden md:block"></div>
    </main>
  );
}
