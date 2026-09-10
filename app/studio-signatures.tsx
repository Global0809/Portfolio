'use client';

import { useEffect, useRef } from 'react';
import { AudioLines, ScanFace, MonitorPlay, Sparkles } from 'lucide-react';

export function StudioSignatures({ paused }: { paused: boolean }) {
  const surface = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      element.dataset.visible = 'true';
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        element.dataset.visible = String(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <ul
      ref={surface}
      className="studio-signatures"
      aria-label="Made for your music"
      data-paused={paused}
    >
      <li className="signature-lipsync">
        <AudioLines size={21} strokeWidth={1.2} aria-hidden="true" />
        <span>
          Perfect <strong>Lipsync</strong>
        </span>
        <i aria-hidden="true" />
      </li>
      <li className="signature-uhd">
        <MonitorPlay size={21} strokeWidth={1.2} aria-hidden="true" />
        <span>
          <strong>4K UHD</strong>
        </span>
        <i aria-hidden="true" />
      </li>
      <li className="signature-face">
        <ScanFace size={21} strokeWidth={1.2} aria-hidden="true" />
        <span>
          Perfect <strong>Face accuracy</strong>
        </span>
        <i aria-hidden="true" />
      </li>
      <li className="signature-song">
        <Sparkles size={21} strokeWidth={1.2} aria-hidden="true" />
        <span>
          Your song, <strong>Our creativity</strong>
        </span>
        <i aria-hidden="true" />
      </li>
    </ul>
  );
}
