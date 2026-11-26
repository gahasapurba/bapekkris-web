import { useRef, type PointerEvent } from 'react';

const MIN_DISTANCE = 40;

/**
 * Horizontal swipe on touch screens: spread the returned handlers on the element. A swipe to the
 * left calls onNext, to the right onPrevious; mostly vertical movements are left to page scrolling.
 */
export function useSwipe(onPrevious: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: PointerEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const dx = e.clientX - from.x;
      const dy = e.clientY - from.y;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onNext();
      else onPrevious();
    },
    onPointerCancel: () => { start.current = null; },
    style: { touchAction: 'pan-y' as const }
  };
}
