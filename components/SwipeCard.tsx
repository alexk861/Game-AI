'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { analytics } from '@/lib/analytics';
import InvestigationOverlay from '@/components/InvestigationOverlay';
import { copy } from '@/lib/copy';
import NextImage from 'next/image';

interface SwipeCardProps {
  challengeId?: string;
  difficulty?: number;
  imageUrl: string;
  onSwipe: (direction: 'ai' | 'real') => void;
  disabled: boolean;
  onNextImageUrl?: string;
  onInvestigatingChange?: (investigating: boolean) => void;
}

export default function SwipeCard({
  challengeId,
  difficulty,
  imageUrl,
  onSwipe,
  disabled,
  onNextImageUrl,
  onInvestigatingChange,
}: SwipeCardProps) {
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    delta: 0,
  });
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [imageErrored, setImageErrored] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const investigateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const THRESHOLD = 76;
  const SWIPE_CANCEL_INVESTIGATE_THRESHOLD = 10;

  const setInvestigating = useCallback((value: boolean) => {
    setIsInvestigating(value);
    onInvestigatingChange?.(value);
  }, [onInvestigatingChange]);

  const clearInvestigateTimer = useCallback(() => {
    if (investigateTimerRef.current) {
      clearTimeout(investigateTimerRef.current);
      investigateTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (onNextImageUrl) {
      const img = new Image();
      img.src = onNextImageUrl;
    }
  }, [onNextImageUrl]);

  useEffect(() => {
    const resetId = setTimeout(() => {
      setExitDirection(null);
      setImageErrored(false);
      setInvestigating(false);
      clearInvestigateTimer();
      setDragState({ isDragging: false, startX: 0, delta: 0 });
    }, 0);

    return () => clearTimeout(resetId);
  }, [imageUrl, clearInvestigateTimer, setInvestigating]);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled || exitDirection) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setDragState({
      isDragging: true,
      startX: event.clientX,
      delta: 0,
    });

    clearInvestigateTimer();
    investigateTimerRef.current = setTimeout(() => {
      setInvestigating(true);
      if (challengeId !== undefined && difficulty !== undefined) {
        analytics.investigateUsed(challengeId, difficulty);
      }
      if (navigator.vibrate) navigator.vibrate([10, 34, 10]);
    }, 640);
  }, [disabled, exitDirection, challengeId, difficulty, clearInvestigateTimer, setInvestigating]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!dragState.isDragging || disabled) return;
    const delta = event.clientX - dragState.startX;
    setDragState(previous => ({ ...previous, delta }));

    if (Math.abs(delta) > SWIPE_CANCEL_INVESTIGATE_THRESHOLD) {
      clearInvestigateTimer();
      setInvestigating(false);
    }
  }, [dragState.isDragging, dragState.startX, disabled, clearInvestigateTimer, setInvestigating]);

  const handlePointerUp = useCallback(() => {
    if (!dragState.isDragging || disabled) return;

    clearInvestigateTimer();
    setInvestigating(false);

    if (Math.abs(dragState.delta) > THRESHOLD) {
      const direction = dragState.delta < 0 ? 'left' : 'right';
      setExitDirection(direction);
      if (navigator.vibrate) navigator.vibrate(28);
      setTimeout(() => {
        onSwipe(direction === 'left' ? 'ai' : 'real');
      }, 260);
    }

    setDragState({ isDragging: false, startX: 0, delta: 0 });
  }, [dragState, disabled, onSwipe, clearInvestigateTimer, setInvestigating]);

  const handlePointerCancel = useCallback(() => {
    clearInvestigateTimer();
    setInvestigating(false);
    setDragState({ isDragging: false, startX: 0, delta: 0 });
  }, [clearInvestigateTimer, setInvestigating]);

  const clampedDelta = Math.max(-128, Math.min(128, dragState.delta));
  const rotation = dragState.isDragging ? clampedDelta * 0.012 : 0;
  const translateX = dragState.isDragging ? clampedDelta : 0;
  const aiIntent = dragState.isDragging ? Math.min(Math.max(-clampedDelta / THRESHOLD, 0), 1) : 0;
  const realIntent = dragState.isDragging ? Math.min(Math.max(clampedDelta / THRESHOLD, 0), 1) : 0;

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface">
      <div
        className={`swipe-card absolute inset-0 overflow-hidden ${
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
        onContextMenu={(event) => event.preventDefault()}
      >
        <NextImage
          src={imageUrl}
          alt="Unresolved visual record"
          className={`absolute inset-0 h-full w-full select-none object-cover transition-all duration-500 ease-out ${isInvestigating ? '' : 'image-breathe'}`}
          draggable={false}
          onError={() => setImageErrored(true)}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{
            filter: isInvestigating
              ? 'contrast(122%) brightness(78%) saturate(64%) blur(0.15px)'
              : '',
            transform: isInvestigating ? 'scale(1.095)' : '',
          }}
        />

        {imageErrored && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface px-8 text-center">
            <div>
              <div className="font-sans text-[10px] font-light uppercase tracking-[0.18em] text-muted/50">
                {copy.errors.imageUnavailable}
              </div>
              <div className="mt-3 text-sm font-sans font-light leading-relaxed text-muted/70">
                {copy.errors.imageUnavailableNote}
              </div>
            </div>
          </div>
        )}

        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: `linear-gradient(to right, rgba(159,166,178,${realIntent * 0.02}), transparent 50%, rgba(184,84,76,${aiIntent * 0.03}))` }}
        />
        <InvestigationOverlay visible={isInvestigating} />
      </div>
    </div>
  );
}
