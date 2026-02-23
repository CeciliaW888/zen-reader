import { useEffect, useRef, useCallback } from 'react';

interface SwipeConfig {
  /** Minimum distance in pixels to trigger a swipe (default: 40) */
  threshold?: number;
  /** Edge zone width as percentage of screen (default: 0.15 = 15%) */
  edgeZone?: number;
  /** Whether swipe is enabled (default: true) */
  enabled?: boolean;
}

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  startedFromLeftEdge: boolean;
  startedFromRightEdge: boolean;
  tracking: boolean;
}

/**
 * Hook for detecting horizontal swipe gestures on mobile devices.
 * Uses edge detection for reliable page flipping on scrollable content.
 *
 * Two ways to trigger:
 * 1. Edge swipe: Start from left/right 15% of screen, swipe inward
 * 2. Full swipe: Horizontal swipe anywhere with enough distance
 */
export function useSwipe(
  _elementRef: React.RefObject<HTMLElement>, // Kept for API compatibility
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
) {
  const {
    threshold = 40,
    edgeZone = 0.15,
    enabled = true
  } = config;

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    startedFromLeftEdge: false,
    startedFromRightEdge: false,
    tracking: false
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    const leftEdgeThreshold = screenWidth * edgeZone;
    const rightEdgeThreshold = screenWidth * (1 - edgeZone);

    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      startedFromLeftEdge: touch.clientX < leftEdgeThreshold,
      startedFromRightEdge: touch.clientX > rightEdgeThreshold,
      tracking: true
    };
  }, [enabled, edgeZone]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchState.current.tracking) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = Date.now() - touchState.current.startTime;

    const { startedFromLeftEdge, startedFromRightEdge } = touchState.current;

    // Reset tracking
    touchState.current.tracking = false;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Ignore if vertical movement is much larger than horizontal (user is scrolling)
    // Be generous: allow up to 2x vertical movement
    if (absY > absX * 2) {
      return;
    }

    // Ignore very slow swipes (likely accidental or scrolling)
    const velocity = absX / deltaTime;
    if (velocity < 0.1 && absX < threshold * 2) {
      return;
    }

    // Method 1: Edge swipe (lower threshold, must swipe inward)
    if (startedFromLeftEdge && deltaX > threshold * 0.6) {
      // Started from left edge, swiped right = previous
      callbacks.onSwipeRight?.();
      return;
    }

    if (startedFromRightEdge && deltaX < -threshold * 0.6) {
      // Started from right edge, swiped left = next
      callbacks.onSwipeLeft?.();
      return;
    }

    // Method 2: Full horizontal swipe anywhere (higher threshold)
    if (absX > threshold && absX > absY) {
      if (deltaX > 0) {
        callbacks.onSwipeRight?.();
      } else {
        callbacks.onSwipeLeft?.();
      }
    }
  }, [threshold, callbacks]);

  useEffect(() => {
    if (!enabled) return;

    // Listen on window for more reliable touch detection
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);
}

/**
 * Hook for keyboard navigation (arrow keys)
 */
export function useKeyboardNavigation(
  callbacks: { onPrev?: () => void; onNext?: () => void },
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' && callbacks.onPrev) {
        e.preventDefault();
        callbacks.onPrev();
      } else if (e.key === 'ArrowRight' && callbacks.onNext) {
        e.preventDefault();
        callbacks.onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks, enabled]);
}
