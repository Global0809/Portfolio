'use client';
import { useEffect, useRef } from 'react';

export function FilmWave({
  video,
  filmId,
  playing,
  muted,
  reduced,
}: {
  video: React.RefObject<HTMLVideoElement | null>;
  filmId: number;
  playing: boolean;
  muted: boolean;
  reduced: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const envelope = useRef<{ fps: number; samples: number[] } | null>(null);
  useEffect(() => {
    envelope.current = null;
    const controller = new AbortController();
    fetch(`/media/wave-${filmId}.json`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'fps' in data &&
          data.fps === 25 &&
          'samples' in data &&
          Array.isArray(data.samples) &&
          data.samples.every(
            (value) => typeof value === 'number' && Number.isFinite(value),
          )
        ) {
          envelope.current = { fps: 25, samples: data.samples };
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [filmId]);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let raf = 0,
      last = 0;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const still = reduced || connection?.saveData;
    function draw() {
      ctx!.clearRect(0, 0, 320, 60);
      const data = envelope.current;
      const position = (video.current?.currentTime || 0) * (data?.fps || 25);
      const audible = playing && !muted;
      for (let i = 0; i < 48; i++) {
        const sample =
          data?.samples[
            Math.max(
              0,
              Math.min(
                data.samples.length - 1,
                Math.floor(position + (i - 24) * 0.65),
              ),
            )
          ] || 0;
        const taper = Math.sin((i / 47) * Math.PI);
        const height = audible ? 2 + (sample / 255) * 36 * taper : 2;
        ctx!.fillStyle = `rgba(212,229,242,${0.22 + taper * 0.48})`;
        ctx!.fillRect(5 + i * 6.5, 30 - height / 2, 2, height);
      }
    }
    function tick(now: number) {
      if (now - last >= 50) {
        draw();
        last = now;
      }
      raf = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(raf);
      draw();
      if (playing && !muted && !still && !document.hidden)
        raf = requestAnimationFrame(tick);
    }
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [video, filmId, playing, muted, reduced]);
  return (
    <canvas
      className="film-wave"
      ref={canvas}
      width={320}
      height={60}
      aria-hidden="true"
    />
  );
}
