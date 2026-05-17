'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface SwipeCardProps {
  imageUrl: string;
  onSwipe: (direction: 'ai' | 'real') => void;
  disabled: boolean;
  onNextImageUrl?: string; // preload next image
}

export default function SwipeCard({ imageUrl, onSwipe, disabled, onNextImageUrl }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    delta: 0,
  });
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const THRESHOLD = 60;

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
    setDragState({ isDragging: false, startX: 0, currentX: 0, delta: 0 });
  }, [imageUrl]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled || exitDirection) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      isDragging: true,
      startX: e.clientX,
      currentX: e.clientX,
      delta: 0,
    });
  }, [disabled, exitDirection]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.isDragging || disabled) return;
    const delta = e.clientX - dragState.startX;
    setDragState(prev => ({ ...prev, currentX: e.clientX, delta }));
  }, [dragState.isDragging, dragState.startX, disabled]);

  const handlePointerUp = useCallback(() => {
    if (!dragState.isDragging || disabled) return;

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
  }, [dragState, disabled, onSwipe]);

  // Calculate visual transforms
  const rotation = dragState.isDragging ? dragState.delta * 0.08 : 0;
  const translateX = dragState.isDragging ? dragState.delta : 0;
  const aiLabelOpacity = dragState.isDragging ? Math.min(Math.max(-dragState.delta / THRESHOLD, 0), 1) : 0;
  const realLabelOpacity = dragState.isDragging ? Math.min(Math.max(dragState.delta / THRESHOLD, 0), 1) : 0;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Image Card */}
      <div
        ref={cardRef}
        className={`swipe-card absolute inset-0 ${
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
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Challenge Image */}
        <img
          src={imageUrl}
          alt="Challenge"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
          onLoad={() => setImageLoaded(true)}
          style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />

        {/* Loading shimmer */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-surface animate-pulse" />
        )}

        {/* Noise Overlay */}
        <div className="noise-overlay" />

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
        {dragState.isDragging && (
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
