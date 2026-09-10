'use client';

import { useEffect, useRef } from 'react';

// One frame per scroll event; nothing runs while the page is idle.
export function ScrollSignal({ paused }: { paused: boolean }) {
  const meter = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = meter.current;
    if (!element) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const layers = Array.from(
      document.querySelectorAll<HTMLElement>('[data-parallax]'),
    ).map((node) => ({
      node,
      center: 0,
      shift: 0,
      amount: Number(node.dataset.parallax) || 0,
    }));
    let frame = 0,
      range = 1,
      lastPercent = -1;
    const draw = () => {
      frame = 0;
      if (document.hidden || paused) return;
      const scroll = Math.max(0, window.scrollY);
      const progress = Math.min(1, scroll / range);
      const percent = Math.round(progress * 100);
      element.style.setProperty('--scroll-progress', String(progress));
      if (percent !== lastPercent) {
        element.setAttribute('aria-valuenow', String(percent));
        if (readout.current)
          readout.current.textContent = String(percent).padStart(2, '0');
        lastPercent = percent;
      }
      for (const layer of layers) {
        layer.shift =
          preference.matches || connection?.saveData
            ? 0
            : Math.max(
                -1,
                Math.min(
                  1,
                  (scroll + innerHeight / 2 - layer.center) / innerHeight,
                ),
              ) * layer.amount;
        layer.node.style.translate = `0 ${layer.shift.toFixed(2)}px`;
      }
    };
    const schedule = () => {
      if (!frame && !paused && !document.hidden)
        frame = requestAnimationFrame(draw);
    };
    const measure = () => {
      range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      for (const layer of layers) {
        const rect = layer.node.getBoundingClientRect();
        layer.center = rect.top + scrollY + rect.height / 2 - layer.shift;
      }
      schedule();
    };
    const resize =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measure)
        : null;
    resize?.observe(document.body);
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    preference.addEventListener('change', schedule);
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else measure();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      preference.removeEventListener('change', schedule);
      document.removeEventListener('visibilitychange', visibility);
      for (const { node } of layers) node.style.removeProperty('translate');
    };
  }, [paused]);

  return (
    <div
      ref={meter}
      className="scroll-signal"
      data-paused={paused}
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <span className="scroll-signal-track" aria-hidden="true">
        <i className="scroll-signal-fill" />
        <i className="scroll-signal-head" />
      </span>
      <span ref={readout} className="scroll-signal-number" aria-hidden="true">
        00
      </span>
    </div>
  );
}
