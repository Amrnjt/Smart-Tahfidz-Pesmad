import { useLayoutEffect, useRef, useState } from 'react';

const FALLBACK_CLOSE_MS = 150;

function readCloseDuration(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return FALLBACK_CLOSE_MS;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 0;

  const rawValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--dropdown-close-dur')
    .trim();
  const duration = Number.parseFloat(rawValue);
  if (!Number.isFinite(duration)) return FALLBACK_CLOSE_MS;
  return rawValue.endsWith('s') && !rawValue.endsWith('ms') ? duration * 1000 : duration;
}

export function useDropdownTransition(isOpen: boolean) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const closeTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (isOpen) {
      setIsMounted(true);
      return;
    }

    if (!isMounted) return;
    closeTimerRef.current = window.setTimeout(() => {
      setIsMounted(false);
      closeTimerRef.current = null;
    }, readCloseDuration());

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen, isMounted]);

  return {
    isMounted: isOpen || isMounted,
    transitionClassName: isOpen ? 'is-open' : 'is-closing'
  };
}
