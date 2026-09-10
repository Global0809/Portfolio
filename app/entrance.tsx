'use client';

import { useEffect, useState } from 'react';

// A short, non-blocking reveal. It never waits for video downloads.
export function Entrance() {
  const [phase, setPhase] = useState('arriving');
  useEffect(() => {
    let disposed = false,
      leaving = false,
      fade = 0,
      remove = 0;
    const leave = () => {
      if (disposed || leaving) return;
      leaving = true;
      setPhase('leaving');
      clearTimeout(fade);
      if (!remove)
        remove = window.setTimeout(() => {
          if (!disposed) setPhase('done');
        }, 450);
    };
    const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Keep a hard deadline, including when a font fails or the connection is slow.
    const deadline = window.setTimeout(leave, quick ? 50 : 1100);
    void document.fonts?.ready.then(() => {
      if (!disposed) fade = window.setTimeout(leave, quick ? 0 : 550);
    });
    window.addEventListener('pointerdown', leave, {
      once: true,
      passive: true,
    });
    window.addEventListener('keydown', leave, { once: true });
    return () => {
      disposed = true;
      clearTimeout(fade);
      clearTimeout(remove);
      clearTimeout(deadline);
      window.removeEventListener('pointerdown', leave);
      window.removeEventListener('keydown', leave);
    };
  }, []);
  if (phase === 'done') return null;
  return (
    <div className="studio-entrance" data-phase={phase} aria-hidden="true">
      <div className="entrance-optics">
        <i />
        <i />
        <i />
      </div>
      <div className="entrance-signature">
        <span>AICANFEEL</span>
        <small>CGI + VFX MUSIC VIDEOS</small>
        <i className="entrance-signal" />
      </div>
    </div>
  );
}
