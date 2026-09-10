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

  useEffect(() => {
    if (!revealImmediately || typeof window === 'undefined') return;

    const host = elementRef.current;
    if (!host) return;

    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;

    const syncMeasuredCharts = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        let changed = false;
        const containers = host.querySelectorAll<HTMLElement>('.recharts-responsive-container');

        containers.forEach(container => {
          const frame = container.parentElement;
          if (!frame) return;

          resizeObserver?.observe(frame);
          const rect = frame.getBoundingClientRect();
          const width = Math.round(rect.width);
          const height = Math.round(rect.height);
          if (width <= 0 || height <= 0) return;

          const widthValue = `${width}px`;
          const heightValue = `${height}px`;
          if (container.style.getPropertyValue('--p323-chart-width') !== widthValue) {
            container.style.setProperty('--p323-chart-width', widthValue);
            changed = true;
          }
          if (container.style.getPropertyValue('--p323-chart-height') !== heightValue) {
            container.style.setProperty('--p323-chart-height', heightValue);
            changed = true;
          }
          container.classList.add('p323-chart-measured');
        });

        if (changed && containers.length > 0) {
          window.dispatchEvent(new Event('resize'));
        }
      });
    };

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncMeasuredCharts);
      resizeObserver.observe(host);
    }

    const mutationObserver = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(syncMeasuredCharts)
      : null;

    mutationObserver?.observe(host, { childList: true, subtree: true });
    syncMeasuredCharts();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [revealImmediately]);

  return (
    <div
      ref={elementRef}
      className={`scroll-reveal ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
