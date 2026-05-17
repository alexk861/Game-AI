'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { analytics } from '@/lib/analytics';

interface SwipeCardProps {
  challengeId?: string;
  difficulty?: number;
  imageUrl: string;
  onSwipe: (direction: 'ai' | 'real') => void;
  disabled: boolean;
  onNextImageUrl?: string; // preload next image
}

export default function SwipeCard({ challengeId, difficulty, imageUrl, onSwipe, disabled, onNextImageUrl }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    delta: 0,
  });
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const investigateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const THRESHOLD = 60;
  const SWIPE_CANCEL_INVESTIGATE_THRESHOLD = 10;

  // Preload next image
  useEffect(() => {
    if (onNextImageUrl) {
      const img = new Image();
      img.src = onNextImageUrl;
    }
  }, [onNextImageUrl]);

  // Reset on new image
  useEffect(() => {
    setExitDirection(null);
    setImageLoaded(false);
    setIsInvestigating(false);
    clearInvestigateTimer();
    setDragState({ isDragging: false, startX: 0, currentX: 0, delta: 0 });
  }, [imageUrl]);

  const clearInvestigateTimer = useCallback(() => {
    if (investigateTimerRef.current) {
      clearTimeout(investigateTimerRef.current);
      investigateTimerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled || exitDirection) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      isDragging: true,
      startX: e.clientX,
      currentX: e.clientX,
      delta: 0,
    });
    
    // Start investigate timer
    clearInvestigateTimer();
    investigateTimerRef.current = setTimeout(() => {
      setIsInvestigating(true);
      if (challengeId !== undefined && difficulty !== undefined) {
        analytics.investigateUsed(challengeId, difficulty);
      }
      if (navigator.vibrate) navigator.vibrate([20, 30, 20]); // distinct buzz
    }, 500);
  }, [disabled, exitDirection, challengeId, difficulty, clearInvestigateTimer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.isDragging || disabled) return;
    const delta = e.clientX - dragState.startX;
    setDragState(prev => ({ ...prev, currentX: e.clientX, delta }));
    
    // Cancel investigate if moving too much
    if (Math.abs(delta) > SWIPE_CANCEL_INVESTIGATE_THRESHOLD) {
      clearInvestigateTimer();
      setIsInvestigating(false);
    }
  }, [dragState.isDragging, dragState.startX, disabled, clearInvestigateTimer]);

  const handlePointerUp = useCallback(() => {
    if (!dragState.isDragging || disabled) return;

    clearInvestigateTimer();
    setIsInvestigating(false);

    const { delta } = dragState;

    if (Math.abs(delta) > THRESHOLD) {
      // Past threshold — trigger guess
      const direction = delta < 0 ? 'left' : 'right';
      setExitDirection(direction);

      // Haptic feedback (Android)
      if (navigator.vibrate) navigator.vibrate(50);

      setTimeout(() => {
        onSwipe(direction === 'left' ? 'ai' : 'real');
      }, 300);
    }

    // Reset drag state (snap back if below threshold)
    setDragState({ isDragging: false, startX: 0, currentX: 0, delta: 0 });
  }, [dragState, disabled, onSwipe, clearInvestigateTimer]);

  const handlePointerCancel = useCallback(() => {
    clearInvestigateTimer();
    setIsInvestigating(false);
    setDragState({ isDragging: false, startX: 0, currentX: 0, delta: 0 });
  }, [clearInvestigateTimer]);

  // Calculate visual transforms
  // Prevent swiping past the edge (hard stop)
  const MAX_DRAG = 140;
  const clampedDelta = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dragState.delta));

  const rotation = dragState.isDragging ? clampedDelta * 0.08 : 0;
  const translateX = dragState.isDragging ? clampedDelta : 0;
  const aiLabelOpacity = dragState.isDragging ? Math.min(Math.max(-clampedDelta / THRESHOLD, 0), 1) : 0;
  const realLabelOpacity = dragState.isDragging ? Math.min(Math.max(clampedDelta / THRESHOLD, 0), 1) : 0;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Image Card */}
      <div
        ref={cardRef}
        className={`swipe-card absolute inset-3 md:inset-6 rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden ${
          exitDirection === 'left' ? 'swipe-card-exit-left' :
          exitDirection === 'right' ? 'swipe-card-exit-right' : ''
        }`}
        style={{
          transform: exitDirection ? undefined : `translateX(${translateX}px) rotate(${rotation}deg)`,
          cursor: disabled ? 'default' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        {/* Challenge Image */}
        <img
          src={imageUrl}
          alt="Challenge"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-500 ease-out"
          draggable={false}
          onLoad={() => setImageLoaded(true)}
          style={{ 
            opacity: imageLoaded ? 1 : 0,
            filter: isInvestigating ? 'contrast(105%) brightness(98%)' : 'none',
            transform: isInvestigating ? 'scale(1.08)' : 'scale(1)',
          }}
        />

        {/* Loading shimmer */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-surface animate-pulse" />
        )}

        {/* Investigate Feedback Overlay */}
        {isInvestigating && (
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            {/* Faint Scanlines */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 3px, rgba(0,0,0,0.5) 3px, rgba(0,0,0,0.5) 4px)' }} />

            {/* Soft Edge Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.2)]" />

            {/* Top-Left Metadata Fragment */}
            <div className="absolute top-4 left-4 text-[8px] font-mono text-white/20 tracking-[0.15em] uppercase leading-loose">
              exif: missing
            </div>

            {/* Bottom-Right Warning Fragment */}
            <div className="absolute bottom-4 right-4 text-[8px] font-mono text-[#994444]/40 tracking-[0.15em] uppercase">
              compression anomaly
            </div>
          </div>
        )}

        {/* Noise Overlay */}
        <div 
          className="noise-overlay transition-opacity duration-1000"
          style={{ opacity: isInvestigating ? 0.16 : undefined }}
        />

        {/* Swipe Labels */}
        <div
          className="swipe-label swipe-label-ai"
          style={{ opacity: aiLabelOpacity }}
        >
          AI
        </div>
        <div
          className="swipe-label swipe-label-real"
          style={{ opacity: realLabelOpacity }}
        >
          REAL
        </div>

        {/* Directional Tint */}
        {dragState.isDragging && !isInvestigating && (
          <>
            <div
              className="absolute inset-0 pointer-events-none z-[4]"
              style={{
                background: `linear-gradient(to left, transparent, rgba(168, 85, 247, ${aiLabelOpacity * 0.15}))`,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none z-[4]"
              style={{
                background: `linear-gradient(to right, transparent, rgba(59, 130, 246, ${realLabelOpacity * 0.15}))`,
              }}
            />
          </>
        )}
      </div>

      {/* Fallback Buttons */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 z-20">
        <button
          onClick={() => !disabled && !exitDirection && onSwipe('ai')}
          disabled={disabled || !!exitDirection}
          className="px-6 py-3 bg-ai/20 border border-ai/40 text-ai font-mono text-sm font-bold 
                     rounded-lg backdrop-blur-sm uppercase tracking-wider
                     transition-all duration-200 hover:bg-ai/30 active:scale-95
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          AI
        </button>
        <button
          onClick={() => !disabled && !exitDirection && onSwipe('real')}
          disabled={disabled || !!exitDirection}
          className="px-6 py-3 bg-real/20 border border-real/40 text-real font-mono text-sm font-bold 
                     rounded-lg backdrop-blur-sm uppercase tracking-wider
                     transition-all duration-200 hover:bg-real/30 active:scale-95
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          REAL
        </button>
      </div>
    </div>
  );
}

