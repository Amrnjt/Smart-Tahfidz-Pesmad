import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  threshold = 0.1,
  once = true,
}) => {
  // Ustadz analytics contains Recharts ResponsiveContainer. It must participate
  // in the first stable layout so the chart can measure a non-zero container;
  // Wali/Santri reveal behavior remains unchanged.
  const revealImmediately = className.split(/\s+/).includes('p323-deferred-surface');
  const [isVisible, setIsVisible] = useState(revealImmediately);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (revealImmediately) return;

    const el = elementRef.current;
    if (!el) return;

    let revealTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            revealTimer = setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => {
      if (revealTimer) clearTimeout(revealTimer);
      observer.disconnect();
    };
  }, [delay, threshold, once, revealImmediately]);

  return (
    <div
      ref={elementRef}
      className={`scroll-reveal ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
