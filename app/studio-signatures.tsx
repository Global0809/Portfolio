'use client';

/* oxlint-disable next/no-img-element -- This lazy decorative fallback is already a 26 KB WebP with explicit dimensions. */
import { useEffect, useRef } from 'react';
import { NeuralFace } from '@/components/ui/neural-face';
import { assetPath } from './site-path';

/** A single optical composition, rather than four unrelated feature cards. */
export function StudioSignatures({ paused, reducedMotion = false }: { paused: boolean; reducedMotion?: boolean }) {
  const surface = useRef<HTMLElement>(null);
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
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <section
      ref={surface}
      id="face-scan"
      className="craft-signatures"
      aria-labelledby="craft-signatures-title"
      data-paused={paused}
    >
      <div className="craft-face-stage" aria-hidden="true">
        <img
          className="craft-face-fallback"
          src={assetPath('media/neural-face.webp')}
          alt=""
          width={420}
          height={480}
          loading="lazy"
          decoding="async"
        />
        <NeuralFace paused={paused} reducedMotion={reducedMotion} />
      </div>
      <h2 id="craft-signatures-title" className="craft-signatures-title">
        <span>Your song.</span>
        <em>Our creativity.</em>
      </h2>

      <div className="craft-optics">
        <div className="craft-optical-axis" aria-hidden="true" />
        <figure className="craft-proof craft-proof-sync">
          <div className="craft-instrument" aria-hidden="true">
            <svg viewBox="0 0 180 132" fill="none">
              <path className="craft-trace-base" d="M8 47H172M8 86H172" />
              <path
                className="craft-wave craft-wave-cool"
                d="M8 47H25L30 40L35 53L40 47H48L54 27L60 68L66 47H73L79 12L85 81L91 47H101L107 30L113 66L119 47H129L134 38L139 55L144 47H172"
              />
              <path
                className="craft-wave craft-wave-warm"
                d="M8 86H25L30 82L35 90L40 86H48L54 74L60 98L66 86H73L79 65L85 107L91 86H101L107 76L113 98L119 86H129L134 81L139 91L144 86H172"
              />
              <path className="craft-sync-guide" d="M79 9V113" />
              <circle cx="79" cy="12" r="2.5" className="craft-dot-cool" />
              <circle cx="79" cy="65" r="2.5" className="craft-dot-warm" />
            </svg>
          </div>
          <figcaption>
            <span>Perfect</span>
            <strong>Lipsync</strong>
          </figcaption>
        </figure>

        <figure className="craft-proof craft-proof-resolution">
          <div className="craft-instrument" aria-hidden="true">
            <svg viewBox="0 0 180 132" fill="none">
              <path
                className="craft-frame-rear"
                d="M22 34L138 18V102L22 118V34Z"
              />
              <path
                className="craft-frame-middle"
                d="M33 27L149 24V108L33 111V27Z"
              />
              <path
                className="craft-frame-front"
                d="M43 19L160 34V118L43 103V19Z"
              />
              <path
                className="craft-frame-detail"
                d="M53 41V31L65 33M138 44L150 46V58M150 95V107L138 105M65 95L53 93V81"
              />
            </svg>
            <span className="craft-resolution-type">4K</span>
          </div>
          <figcaption>
            <span className="sr-only">4K</span>
            <strong>UHD</strong>
          </figcaption>
        </figure>

        <figure className="craft-proof craft-proof-accuracy">
          <div className="craft-instrument" aria-hidden="true">
            <svg viewBox="0 0 180 132" fill="none">
              <path
                className="craft-scan-brackets"
                d="M28 40V22H46M134 22H152V40M152 92V110H134M46 110H28V92"
              />
              <path
                className="craft-scan-mesh"
                d="M51 46L86 26L127 43L138 78L106 105L66 99L42 75L51 46ZM51 46L96 63L127 43M86 26L96 63L106 105M42 75L96 63L66 99M96 63L138 78"
              />
              <path className="craft-scan-crosshair" d="M87 63H105M96 54V72" />
              <circle cx="96" cy="63" r="15" className="craft-scan-ring" />
              <g className="craft-scan-points">
                <circle cx="51" cy="46" r="2" />
                <circle cx="86" cy="26" r="2" />
                <circle cx="127" cy="43" r="2" />
                <circle cx="138" cy="78" r="2" />
                <circle cx="106" cy="105" r="2" />
                <circle cx="66" cy="99" r="2" />
                <circle cx="42" cy="75" r="2" />
              </g>
            </svg>
          </div>
          <figcaption>
            <span>Perfect</span>
            <strong>Face accuracy</strong>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
