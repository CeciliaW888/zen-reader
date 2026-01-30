import { useEffect, useRef, useCallback } from 'react';

interface SwipeConfig {
  /** Minimum distance in pixels to trigger a swipe (default: 50) */
  threshold?: number;
  /** Minimum velocity in px/ms to trigger a swipe with shorter distance (default: 0.3) */
  velocityThreshold?: number;
  /** Maximum vertical movement ratio to horizontal to still count as horizontal swipe (default: 0.75) */
  verticalTolerance?: number;
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
  tracking: boolean;
}

/**
 * Hook for detecting horizontal swipe gestures on mobile devices.
 * Designed for smooth, low-effort page flipping.
 *
 * Features:
 * - Low threshold for easy triggering
 * - Velocity-based detection (fast swipes can be shorter)
 * - Ignores vertical scrolling
 * - Doesn't interfere with text selection
 */
export function useSwipe(
  elementRef: React.RefObject<HTMLElement>,
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    verticalTolerance = 0.75,
    enabled = true
  } = config;

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    tracking: false
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      tracking: true
    };
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchState.current.tracking) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;

    // If vertical movement is dominant, stop tracking (user is scrolling)
    if (Math.abs(deltaY) > Math.abs(deltaX) * (1 / verticalTolerance)) {
      touchState.current.tracking = false;
    }
  }, [verticalTolerance]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchState.current.tracking) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = Date.now() - touchState.current.startTime;

    // Reset tracking
    touchState.current.tracking = false;

    // Check if this is a horizontal swipe
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Ignore if vertical movement is too large
    if (absY > absX * verticalTolerance) {
      return;
    }

    // Calculate velocity (px/ms)
    const velocity = absX / deltaTime;

    // Determine if swipe threshold is met
    // Either: distance > threshold OR (distance > threshold/2 AND velocity > velocityThreshold)
    const meetsThreshold = absX > threshold || (absX > threshold / 2 && velocity > velocityThreshold);

    if (!meetsThreshold) {
      return;
    }

    // Trigger appropriate callback
    if (deltaX > 0 && callbacks.onSwipeRight) {
      callbacks.onSwipeRight();
    } else if (deltaX < 0 && callbacks.onSwipeLeft) {
      callbacks.onSwipeLeft();
    }
  }, [threshold, velocityThreshold, verticalTolerance, callbacks]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    // Use passive: false to allow preventDefault if needed in future
    // But currently we don't prevent default to allow normal scrolling
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
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
