'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { ReservationOptics } from '@/components/ui/reservation-optics';
import { reservation } from './reservation-config';
import { studio } from './studio-config';

export function StudioReservation({ paused, reducedMotion }: { paused: boolean; reducedMotion: boolean }) {
  const section = useRef<HTMLElement>(null);
  const soldOut = reservation.remainingSlots === 0;
  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      element.dataset.visible = String(entry.isIntersecting);
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="reserve" className="studio-reservation" ref={section} aria-labelledby="reservation-title" data-paused={paused}>
      <div className="reservation-composition">
        <div className="reservation-intro" data-reveal>
          <h2 id="reservation-title">The next music video.<br /><em>Make it yours.</em></h2>
          <p className="reservation-description">Your music deserves its own world.<br />Reserve a place to create it with AICANFEEL.</p>
          <p className="reservation-availability">
            <span className="reservation-status-light" aria-hidden="true" />
            {soldOut ? 'This intake is full' : reservation.remainingSlots !== null ? <><strong>{reservation.remainingSlots} slots available</strong><span>for the next intake</span></> : <strong>Limited studio availability</strong>}
          </p>
          {reservation.remainingSlots !== null && reservation.remainingSlots > 0 && (
            <div className="reservation-place-lights" aria-hidden="true">
              {Array.from({ length: Math.min(reservation.remainingSlots, 30) }, (_, index) => <i key={index} style={{ '--place': index } as React.CSSProperties} />)}
            </div>
          )}
        </div>

        <div className="reservation-art" aria-label="A place for your music at AICANFEEL">
          <div className="reservation-material-fallback" aria-hidden="true"><i /><i /></div>
          <ReservationOptics paused={paused} reducedMotion={reducedMotion} />
          <div className="reservation-pass">
            <span className="reservation-pass-brand">AICANFEEL <span>STUDIO RESERVATION</span></span>
            <p className="reservation-pass-title">A place for<br /><em>your music.</em></p>
            <div className="reservation-pass-contact"><MessageCircle size={15} strokeWidth={1.5} aria-hidden="true" /><span>@aicanfeel</span></div>
            <span className="reservation-pass-edge" aria-hidden="true" />
          </div>
        </div>

        <div className="reservation-action" data-reveal>
          <div className="reservation-contact-copy">
            <span className="reservation-contact-mark" aria-hidden="true"><MessageCircle size={17} strokeWidth={1.6} /></span>
            <p><strong>Start with your song.</strong><span>Message us on Instagram. We’ll confirm availability and plan your music video.</span></p>
          </div>
          <a className="reservation-book" href={studio.instagramMessageUrl} target="_blank" rel="noopener noreferrer" aria-describedby="reservation-contact-note" data-press data-scan="contact" data-scan-id="reservation-checkout">
            <span>{soldOut ? 'Ask about the next slot' : 'Reserve slot'}</span><ArrowUpRight size={21} strokeWidth={1.6} aria-hidden="true" data-scan-port />
          </a>
          <p id="reservation-contact-note" className="reservation-contact-note">
            Opens @aicanfeel on Instagram.
          </p>
        </div>
      </div>
    </section>
  );
}
