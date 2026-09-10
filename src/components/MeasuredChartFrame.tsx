import React, { useLayoutEffect, useRef, useState } from 'react';

interface MeasuredChartFrameProps {
  children: React.ReactElement<{ width?: number; height?: number }>;
}

export function MeasuredChartFrame({ children }: MeasuredChartFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const width = frame.clientWidth;
      const height = frame.clientHeight;
      setSize(previous => previous.width === width && previous.height === height
        ? previous
        : { width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const ready = size.width > 0 && size.height > 0;
  return (
    <div ref={frameRef} className="p323-chart-frame" style={{ width: '100%', height: '100%', minWidth: 0 }}>
      {ready ? React.cloneElement(children, size) : (
        <div role="status" className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-500">
          Menyiapkan grafik…
        </div>
      )}
    </div>
  );
}
