'use client';

import { useEffect, useRef } from 'react';
import { AudioLines, Focus, MonitorPlay, Sparkles } from 'lucide-react';

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
      id="studio-features"
      className="studio-signatures"
      aria-label="Made for your music"
      data-paused={paused}
    >
      <li className="signature-lipsync">
        <AudioLines size={16} strokeWidth={1.25} aria-hidden="true" />
        <span>
          Perfect <strong>Lipsync</strong>
        </span>
      </li>
      <li className="signature-uhd">
        <MonitorPlay size={16} strokeWidth={1.25} aria-hidden="true" />
        <span>
          <strong>4K UHD</strong>
        </span>
      </li>
      <li className="signature-face">
        <Focus size={16} strokeWidth={1.25} aria-hidden="true" />
        <span>
          Perfect <strong>Face accuracy</strong>
        </span>
      </li>
      <li className="signature-song">
        <Sparkles size={16} strokeWidth={1.25} aria-hidden="true" />
        <span>
          Your song, <strong>Our creativity</strong>
        </span>
      </li>
    </ul>
  );
}
