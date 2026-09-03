import { useCallback, useRef, MouseEvent, KeyboardEvent } from 'react';

interface RippleOptions {
  disabled?: boolean;
}

export function useRipple<T extends HTMLElement = HTMLButtonElement>(options: RippleOptions = {}) {
  const elementRef = useRef<T>(null);

  const createRipple = useCallback((e: MouseEvent<T> | KeyboardEvent<T>) => {
    if (options.disabled) return;
    const el = elementRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let x: number, y: number;

    if ('clientX' in e && typeof e.clientX === 'number') {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else {
      x = rect.width / 2;
      y = rect.height / 2;
    }

    const size = Math.max(rect.width, rect.height);
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    wave.style.left = `${x - size / 2}px`;
    wave.style.top = `${y - size / 2}px`;

    el.appendChild(wave);
    setTimeout(() => wave.remove(), 300);
  }, [options.disabled]);

  return { elementRef, createRipple };
}
