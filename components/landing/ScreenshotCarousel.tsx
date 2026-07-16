'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

interface Screenshot {
  src: string;
  title: string;
  desc: string;
}

export default function ScreenshotCarousel({ screenshots }: { screenshots: Screenshot[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    // Calculate the index using a threshold
    const index = Math.round(scrollLeft / width);
    if (index !== activeIndex && index >= 0 && index < screenshots.length) {
      setActiveIndex(index);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop View: Larger 5-card responsive grid */}
      <div className="hidden md:grid grid-cols-5 gap-6 max-w-6xl mx-auto justify-center px-4">
        {screenshots.map((ss, idx) => (
          <div key={idx} className="flex flex-col items-center text-center group">
            {/* Phone/Card Frame container - Made larger (max-w-[210px]) for perfect readability */}
            <div className="relative aspect-[9/16] w-full max-w-[195px] lg:max-w-[215px] overflow-hidden border border-border-dim bg-background group-hover:border-outline transition-all duration-300">
              <Image 
                src={ss.src} 
                alt={ss.title}
                fill
                className="object-cover pointer-events-none"
                sizes="(max-width: 768px) 100vw, 215px"
                priority
              />
            </div>
            <h4 className="font-mono text-label lg:text-label-lg font-bold text-foreground mt-5 mb-1.5 uppercase tracking-label">
              {ss.title}
            </h4>
            <p className="text-label lg:text-xs text-muted px-2 font-light leading-relaxed max-w-[200px]">
              {ss.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile View: Swipeable horizontal carousel showing one screenshot at a time */}
      <div className="md:hidden flex flex-col items-center w-full">
        {/* Scrollable track with native touch physics and CSS scroll snap */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full overflow-x-auto flex snap-x snap-mandatory scrollbar-none scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {screenshots.map((ss, idx) => (
            <div key={idx} className="w-full flex-shrink-0 flex justify-center items-center snap-center px-6">
              <div className="relative aspect-[9/16] w-full max-w-[240px] overflow-hidden border border-border-dim bg-background">
                <Image 
                  src={ss.src} 
                  alt={ss.title}
                  fill
                  className="object-cover pointer-events-none"
                  sizes="240px"
                  priority
                />
              </div>
            </div>
          ))}
        </div>

        {/* Caption placed directly underneath */}
        <div className="mt-5 text-center px-6 min-h-[64px] flex flex-col justify-center">
          <h4 className="font-mono text-label-lg font-bold text-foreground uppercase tracking-label">
            {screenshots[activeIndex]?.title}
          </h4>
          <p className="text-xs text-muted mt-1.5 font-light max-w-[260px] mx-auto leading-relaxed">
            {screenshots[activeIndex]?.desc}
          </p>
        </div>

        {/* Small progress dots */}
        <div className="flex justify-center gap-2 mt-5">
          {screenshots.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  container.scrollTo({
                    left: idx * container.clientWidth,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`h-1.5 transition-all duration-300 ${
                idx === activeIndex
                  ? 'bg-foreground w-5'
                  : 'bg-border-dim w-1.5'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
