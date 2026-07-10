'use client';

import React from 'react';

interface UncannyLogoProps {
  size?: number;
  className?: string;
  symbolColor?: string;
}

export default function UncannyLogo({
  size = 80,
  className = '',
  symbolColor = 'currentColor', // Default to current text color for seamless Tailwind integration
}: UncannyLogoProps) {
  const cx = 50;
  const cy = 50;
  const r = 32;
  // Dynamically thicken stroke and expand gaps at small sizes to prevent anti-aliasing merging
  const strokeWidth = size < 40 ? 11 : 8; 
  const gap = size < 40 ? 7 : 4.5; // Gap degrees between segments

  // Fix server/client trig precision drift (Math.cos/sin differ in the last
  // ulp between Node and browsers), which caused React hydration mismatches.
  const fixed = (n: number) => n.toFixed(3);

  const getArcPath = (radius: number, startAngle: number, endAngle: number) => {
    const rad = Math.PI / 180;
    const x1 = cx + radius * Math.cos(startAngle * rad);
    const y1 = cy + radius * Math.sin(startAngle * rad);
    const x2 = cx + radius * Math.cos(endAngle * rad);
    const y2 = cy + radius * Math.sin(endAngle * rad);

    return `M ${fixed(x1)} ${fixed(y1)} A ${radius} ${radius} 0 0 1 ${fixed(x2)} ${fixed(y2)}`;
  };

  const segments = Array.from({ length: 7 }).map((_, i) => {
    const baseStart = i * (360 / 7);
    const baseEnd = (i + 1) * (360 / 7);
    
    // Apply gap padding
    let startAngle = baseStart + gap / 2;
    let endAngle = baseEnd - gap / 2;
    let currentRadius = r;
    let shiftX = 0;
    let shiftY = 0;

    // Segment #3 (index 2) rotated 3.8 degrees tangent-outward and pushed radially outward
    if (i === 2) {
      const rotationShift = 3.8;
      startAngle += rotationShift;
      endAngle += rotationShift;
      currentRadius += 2.5; // Pushed outward

      // Visual translation shift to emphasize tangent-outward placement
      const midAngle = (startAngle + endAngle) / 2;
      const rad = Math.PI / 180;
      shiftX = Number((2.0 * Math.cos(midAngle * rad)).toFixed(3));
      shiftY = Number((2.0 * Math.sin(midAngle * rad)).toFixed(3));
    }

    const pathData = getArcPath(currentRadius, startAngle, endAngle);

    return (
      <path
        key={i}
        d={pathData}
        fill="none"
        stroke={symbolColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={i === 2 ? 'animate-[pulseShift_2.5s_ease-in-out_infinite_alternate]' : ''}
        style={i === 2 ? {
          transform: `translate(${shiftX}px, ${shiftY}px)`,
          transformOrigin: '50px 50px',
        } : undefined}
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`select-none ${className}`}
    >
      {/* Central Void Core */}
      <circle cx={cx} cy={cy} r={r - strokeWidth / 2 - 2} fill="var(--bg)" opacity="0.1" />
      
      {/* Aperture Segments */}
      <g className="transition-all duration-300">
        {segments}
      </g>
      
      <style jsx>{`
        @keyframes pulseShift {
          0% {
            opacity: 0.9;
            filter: brightness(1);
          }
          100% {
            opacity: 1;
            filter: brightness(1.08) drop-shadow(0 0 1px rgba(240,236,233,0.15));
          }
        }
      `}</style>
    </svg>
  );
}
