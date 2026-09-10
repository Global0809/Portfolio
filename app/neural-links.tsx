'use client';

import { useEffect, useRef } from 'react';

type Props = { paused: boolean; reduced: boolean; signal: number };
type Box = { x: number; y: number; w: number; h: number };
type Track = {
  from: Box;
  to: Box;
  delay: number;
  accent: boolean;
  label: string;
};
type Link = { a: number; b: number };
type Control = { element: HTMLElement; box: Box; id: string; action: string };

// Double the switching cadence without increasing the canvas frame budget.
const SWITCH_SPEED = 2;
const TRANSITION_MS = 560 / SWITCH_SPEED;

// Small generative relay nodes connect to measured DOM control edges.
// No camera, pointer-following scene, or continuously running layout loop.
export function NeuralLinks({ paused, reduced, signal }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ paused, reduced, signal });
  const syncRef = useRef<(() => void) | null>(null);
  const signalRef = useRef<(() => void) | null>(null);
  settings.current = { paused, reduced, signal };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (
      navigator as Navigator & {
        connection?: {
          saveData?: boolean;
          addEventListener?: (type: string, fn: () => void) => void;
          removeEventListener?: (type: string, fn: () => void) => void;
        };
      }
    ).connection;
    let disposed = false,
      frame = 0,
      hold = 0,
      layoutFrame = 0;
    let width = 0,
      height = 0,
      mobile = true;
    let started = 0,
      previousDraw = 0,
      cycle = 0;
    let tracks: Track[] = [],
      links: Link[] = [];
    let focusArea: Box | null = null;
    let controls: Control[] = [],
      focused: HTMLElement | null = null,
      scrollY = window.scrollY;
    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>('[data-scan]'),
    );
    const anchors = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.editorial h1, .sculpture-wrap, .film-index, .invitation-glass',
      ),
    );
    const staticMode = () =>
      preference.matches || settings.current.reduced || !!connection?.saveData;
    const visible = () => !document.hidden && !settings.current.paused;
    const stop = () => {
      cancelAnimationFrame(frame);
      clearTimeout(hold);
      cancelAnimationFrame(layoutFrame);
      frame = hold = layoutFrame = 0;
      canvas.dataset.running = 'false';
    };
    function measure() {
      scrollY = window.scrollY;
      controls = buttons
        .flatMap((element) => {
          const port = element
            .querySelector<HTMLElement>('[data-scan-port]')
            ?.getBoundingClientRect();
          const r = port?.width ? port : element.getBoundingClientRect();
          if (
            !r.width ||
            !r.height ||
            r.top < 10 ||
            r.bottom > height - 10 ||
            r.left < 0 ||
            r.right > width ||
            element.closest('[inert]') ||
            element.matches(':disabled')
          )
            return [];
          return [
            {
              element,
              box: { x: r.left, y: r.top, w: r.width, h: r.height },
              id: element.dataset.scanId || '',
              action: element.dataset.scan || '',
            },
          ];
        })
        .sort((a, b) => {
          const rank = (c: Control) =>
            (c.element === focused ? 1000 : 0) +
            (c.id === 'intake-request'
              ? 100
              : c.action === 'book'
                ? 30
                : c.action === 'watch'
                  ? 20
                  : 0) +
            (c.element.dataset.scanFilm === String(settings.current.signal)
              ? 50
              : 0);
          return rank(b) - rank(a);
        })
        .slice(0, mobile ? 4 : 6);
      const lock = controls.find((c) => c.element === focused) || controls[0];
      buttons.forEach((element) => {
        if (element === lock?.element && visible())
          element.dataset.scanActive = 'true';
        else element.removeAttribute('data-scan-active');
      });
      canvas!.dataset.targets = controls.map((c) => c.id).join(',');
      const rects = [...anchors]
        .sort(
          (a, b) =>
            Number(b.classList.contains('sculpture-wrap')) -
            Number(a.classList.contains('sculpture-wrap')),
        )
        .map((element) => element.getBoundingClientRect());
      const region = rects.find(
        (r) =>
          r.width && r.top > -r.height / 2 && r.bottom < height + r.height / 2,
      );
      focusArea = region
        ? { x: region.left, y: region.top, w: region.width, h: region.height }
        : null;
    }
    function destination(index: number): Box {
      const w = 8 + Math.random() * (mobile ? 14 : 22);
      const h = 8 + Math.random() * (mobile ? 13 : 20);
      let x = Math.random() * (width - w - 16) + 8;
      let y = Math.random() * (height - h - 24) + 12;
      // Film / title edges give the free-running geometry a relationship to the
      // composition. Remaining nodes are distributed through the viewport.
      if (index < 3 && focusArea) {
        x =
          index % 2
            ? focusArea.x + focusArea.w - w * 0.4
            : focusArea.x - w * 0.6;
        y = focusArea.y + focusArea.h * (0.15 + index * 0.28);
      } else if (mobile && index % 3 !== 0) {
        x = index % 2 ? width - w - 12 : 12;
      }
      return {
        x: Math.round(Math.max(10, Math.min(width - w - 10, x))),
        y: Math.round(Math.max(22, Math.min(height - h - 14, y))),
        w: Math.round(w),
        h: Math.round(h),
      };
    }
    function connect() {
      const edges: Link[] = [];
      const used = new Set<string>();
      tracks.forEach((track, a) => {
        let nearest = -1,
          distance = Infinity;
        tracks.forEach((other, b) => {
          if (a === b) return;
          const d = Math.hypot(
            track.to.x - other.to.x,
            track.to.y - other.to.y,
          );
          if (d < distance) {
            distance = d;
            nearest = b;
          }
        });
        const key = [a, nearest].sort((a, b) => a - b).join('-');
        if (nearest >= 0 && !used.has(key)) {
          edges.push({ a, b: nearest });
          used.add(key);
        }
      });
      // A few long links make it read as tracking rather than a particle field.
      for (let a = 0; a < (mobile ? 2 : 4); a++) {
        const b = (a + Math.floor(tracks.length / 2) + cycle) % tracks.length;
        if (a !== b) edges.push({ a, b });
      }
      links = edges;
    }
    function draw(progress = 1) {
      ctx!.clearRect(0, 0, width, height);
      const positions = tracks.map((track) => {
        const t = Math.max(0, Math.min(1, (progress - track.delay) / 0.52));
        // Fast acquisition followed by a quiet hold; no full-screen flashing.
        const ease = 1 - Math.pow(1 - t, 4);
        return {
          x: track.from.x + (track.to.x - track.from.x) * ease,
          y: track.from.y + (track.to.y - track.from.y) * ease,
          w: track.from.w + (track.to.w - track.from.w) * ease,
          h: track.from.h + (track.to.h - track.from.h) * ease,
        };
      });
      ctx!.lineWidth = 0.75;
      ctx!.strokeStyle = 'rgba(193,213,227,.17)';
      ctx!.beginPath();
      for (const link of links) {
        const a = positions[link.a],
          b = positions[link.b];
        ctx!.moveTo(a.x + a.w / 2, a.y + a.h / 2);
        ctx!.lineTo(b.x + b.w / 2, b.y + b.h / 2);
      }
      ctx!.stroke();
      positions.forEach((box, i) => {
        ctx!.strokeStyle = tracks[i].accent
          ? 'rgba(226,208,189,.52)'
          : 'rgba(213,230,241,.44)';
        ctx!.strokeRect(
          Math.round(box.x) + 0.5,
          Math.round(box.y) + 0.5,
          Math.round(box.w),
          Math.round(box.h),
        );
        ctx!.fillStyle = tracks[i].accent
          ? 'rgba(233,218,201,.7)'
          : 'rgba(227,240,248,.75)';
        ctx!.fillRect(Math.round(box.x) - 1, Math.round(box.y) - 1, 2, 2);
        if (i % 3 === 0) {
          const x = box.x + box.w / 2,
            y = box.y + box.h / 2;
          ctx!.beginPath();
          ctx!.moveTo(x - 3, y);
          ctx!.lineTo(x + 3, y);
          ctx!.moveTo(x, y - 3);
          ctx!.lineTo(x, y + 3);
          ctx!.stroke();
        }
        if (tracks[i].label) {
          ctx!.font = '8px ui-monospace, SFMono-Regular, Consolas, monospace';
          ctx!.fillStyle = 'rgba(220,233,242,.58)';
          ctx!.textBaseline = 'bottom';
          const labelWidth = ctx!.measureText(tracks[i].label).width;
          ctx!.fillText(
            tracks[i].label,
            Math.max(6, Math.min(width - labelWidth - 6, box.x)),
            Math.max(12, box.y - 4),
          );
        }
      });
      controls.forEach((control, index) => {
        const b = control.box;
        const centre = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
        const sources = positions
          .map((p) => ({ x: p.x + p.w / 2, y: p.y + p.h / 2 }))
          .filter(
            (p) =>
              !(
                p.x > b.x - 24 &&
                p.x < b.x + b.w + 24 &&
                p.y > b.y - 24 &&
                p.y < b.y + b.h + 24
              ),
          );
        sources.sort(
          (a, c) =>
            Math.hypot(a.x - centre.x, a.y - centre.y) -
            Math.hypot(c.x - centre.x, c.y - centre.y),
        );
        const from = sources[0] || {
          x: b.x > width / 2 ? 12 : width - 12,
          y: Math.max(16, b.y - 35),
        };
        const dx = from.x - centre.x,
          dy = from.y - centre.y;
        const end =
          Math.abs(dx / b.w) > Math.abs(dy / b.h)
            ? { x: dx < 0 ? b.x : b.x + b.w, y: centre.y }
            : { x: centre.x, y: dy < 0 ? b.y : b.y + b.h };
        const locked = control.element.dataset.scanActive === 'true';
        ctx!.lineWidth = locked ? 1 : 0.75;
        ctx!.strokeStyle = locked
          ? 'rgba(226,225,211,.62)'
          : 'rgba(193,218,234,.34)';
        ctx!.beginPath();
        ctx!.moveTo(from.x, from.y);
        ctx!.lineTo(end.x, end.y);
        ctx!.stroke();
        // The signal terminates exactly on the control perimeter, not its text.
        ctx!.strokeRect(end.x - 3, end.y - 3, 6, 6);
        ctx!.fillStyle = locked
          ? 'rgba(248,232,207,.95)'
          : 'rgba(211,233,247,.65)';
        ctx!.fillRect(end.x - 1, end.y - 1, 2, 2);
        if (locked) {
          if (progress < 1 && !staticMode()) {
            const t = Math.min(1, progress / 0.8);
            ctx!.beginPath();
            ctx!.arc(
              from.x + (end.x - from.x) * t,
              from.y + (end.y - from.y) * t,
              1.6,
              0,
              Math.PI * 2,
            );
            ctx!.fill();
          }
          const angle = Math.abs(
            (Math.atan2(end.y - from.y, end.x - from.x) * 180) / Math.PI,
          ).toFixed(1);
          ctx!.font = '8px ui-monospace, SFMono-Regular, Consolas, monospace';
          ctx!.fillStyle = 'rgba(219,232,239,.64)';
          ctx!.textBaseline = 'bottom';
          ctx!.fillText(
            `${String(index + 1).padStart(2, '0')} / ${angle}°`,
            Math.max(6, Math.min(width - 72, b.x + 8)),
            b.y - 5,
          );
        }
      });
      // Keep every connection continuous; low contrast preserves readability.
      // Labels are ornamental mathematical fragments, not measured user data.
    }
    function notation(index: number) {
      if ((index + cycle) % 3 !== 0) return '';
      const n = (index * 31 + cycle * 17) % 360;
      return [
        `θ ${n.toFixed(1)}°`,
        `Δ ${(n / 360).toFixed(3)}`,
        '3²+4²=5²',
        `(${String(n).padStart(3, '0')})`,
        'φ 1.618',
      ][(index + cycle) % 5];
    }
    function animate(now: number) {
      frame = 0;
      if (disposed || !visible() || staticMode()) return;
      const progress = Math.min(1, (now - started) / TRANSITION_MS);
      if (now - previousDraw >= (mobile ? 50 : 40) || progress === 1) {
        previousDraw = now;
        draw(progress);
      }
      if (progress < 1) frame = requestAnimationFrame(animate);
      else {
        canvas!.dataset.running = 'false';
        hold = window.setTimeout(
          () => burst(),
          (mobile ? 1150 : 850) / SWITCH_SPEED,
        );
      }
    }
    function burst() {
      stop();
      if (disposed || !visible() || staticMode()) return;
      measure();
      cycle++;
      tracks.forEach((track, i) => {
        track.from = { ...track.to };
        if ((i + cycle) % 3 === 0) track.to = destination(i);
        track.delay = (i % 3) * 0.1;
        track.label = notation(i);
      });
      connect();
      started = performance.now();
      previousDraw = 0;
      canvas!.dataset.running = 'true';
      frame = requestAnimationFrame(animate);
    }
    function sync() {
      stop();
      if (!visible()) {
        ctx!.clearRect(0, 0, width, height);
        buttons.forEach((element) =>
          element.removeAttribute('data-scan-active'),
        );
        return;
      }
      measure();
      draw();
      if (!staticMode())
        hold = window.setTimeout(() => burst(), 650 / SWITCH_SPEED);
    }
    function resize() {
      stop();
      width = Math.round(canvas!.getBoundingClientRect().width);
      height = Math.round(canvas!.getBoundingClientRect().height);
      if (!width || !height) return;
      mobile = width < 761;
      const ratio = Math.min(
        devicePixelRatio || 1,
        mobile ? 1 : 1.25,
        Math.sqrt(1_100_000 / (width * height)),
      );
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
      measure();
      tracks = Array.from({ length: mobile ? 6 : 10 }, (_, i) => {
        const box = destination(i);
        return {
          from: box,
          to: box,
          delay: 0,
          accent: i % 5 === 0,
          label: notation(i),
        };
      });
      connect();
      canvas!.dataset.nodes = String(tracks.length);
      sync();
    }
    const scrollChanged = () => {
      const delta = scrollY - window.scrollY;
      scrollY = window.scrollY;
      controls.forEach((c) => {
        c.box.y += delta;
      });
      if (!visible() || layoutFrame) return;
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = 0;
        if (disposed || !visible()) return;
        measure();
        draw(
          frame
            ? Math.min(1, (performance.now() - started) / TRANSITION_MS)
            : 1,
        );
      });
    };
    const acquire = (event: Event) => {
      if (!visible() || !(event.target instanceof Element)) return;
      if (
        event instanceof PointerEvent &&
        event.type === 'pointerdown' &&
        (!event.isPrimary || event.button !== 0)
      )
        return;
      const control = event.target.closest<HTMLElement>('[data-scan]');
      if (
        !control ||
        !buttons.includes(control) ||
        (focused === control && event.type === 'pointerover')
      )
        return;
      focused = control;
      measure();
      if (staticMode()) draw();
      else burst();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const contentObserver = new ResizeObserver(scrollChanged);
    const main = canvas.closest('main');
    if (main) contentObserver.observe(main);
    buttons.forEach((button) => contentObserver.observe(button));
    window.addEventListener('scroll', scrollChanged, { passive: true });
    window.addEventListener('pointerdown', acquire, { passive: true });
    window.addEventListener('pointerover', acquire, { passive: true });
    document.addEventListener('focusin', acquire);
    document.addEventListener('visibilitychange', sync);
    preference.addEventListener('change', sync);
    connection?.addEventListener?.('change', sync);
    syncRef.current = sync;
    signalRef.current = () => {
      if (!visible()) return;
      if (staticMode()) {
        measure();
        draw();
        return;
      }
      if (performance.now() - started > 250 / SWITCH_SPEED) burst();
      else {
        measure();
        draw();
      }
    };
    resize();
    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      contentObserver.disconnect();
      window.removeEventListener('scroll', scrollChanged);
      window.removeEventListener('pointerdown', acquire);
      window.removeEventListener('pointerover', acquire);
      document.removeEventListener('focusin', acquire);
      buttons.forEach((element) => element.removeAttribute('data-scan-active'));
      document.removeEventListener('visibilitychange', sync);
      preference.removeEventListener('change', sync);
      connection?.removeEventListener?.('change', sync);
      syncRef.current = signalRef.current = null;
    };
  }, []);

  useEffect(() => {
    syncRef.current?.();
  }, [paused, reduced]);
  useEffect(() => {
    signalRef.current?.();
  }, [signal]);

  return (
    <canvas
      ref={canvasRef}
      className="neural-links"
      aria-hidden="true"
      data-running="false"
    />
  );
}
