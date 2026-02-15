import { useEffect, useRef, useCallback } from "react";

interface VirtualScrollState {
  scrollOffset: React.MutableRefObject<number>;
  scrollVelocity: React.MutableRefObject<number>;
  frictionRef: React.MutableRefObject<number>;
  update: () => void;
}

/**
 * Physics-based virtual scroll with momentum.
 * Input impulses add to velocity, velocity decays via friction,
 * position accumulates from velocity each frame.
 * frictionRef is exposed so it can be driven by Leva at runtime.
 */
export function useVirtualScroll(initialFriction = 0.95): VirtualScrollState {
  const scrollOffset = useRef(0);
  const scrollVelocity = useRef(0);
  const frictionRef = useRef(initialFriction);

  // Accumulates raw impulses from input events between frames
  const pendingDelta = useRef(0);

  // Touch tracking
  const lastTouchY = useRef(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      pendingDelta.current += e.deltaY * 0.01;
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0].clientY;
      scrollVelocity.current = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const currentY = e.touches[0].clientY;
      const delta = lastTouchY.current - currentY;
      pendingDelta.current += delta * 0.01;
      lastTouchY.current = currentY;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const update = useCallback(() => {
    // Add pending input impulse to velocity
    scrollVelocity.current += pendingDelta.current;
    pendingDelta.current = 0;

    // Apply friction: velocity decays each frame
    scrollVelocity.current *= frictionRef.current;

    // Kill tiny velocities to avoid infinite drift
    if (Math.abs(scrollVelocity.current) < 0.0001) {
      scrollVelocity.current = 0;
    }

    // Accumulate position from velocity
    scrollOffset.current += scrollVelocity.current;
  }, []);

  return { scrollOffset, scrollVelocity, frictionRef, update };
}
