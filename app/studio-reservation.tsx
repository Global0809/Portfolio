'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight, Check, LockKeyhole } from 'lucide-react';
import { ReservationOptics } from '@/components/ui/reservation-optics';
import { reservation, reservationCheckoutUrl } from './reservation-config';

export function StudioReservation({ paused, reducedMotion }: { paused: boolean; reducedMotion: boolean }) {
  const section = useRef<HTMLElement>(null);
  const checkoutUrl = reservationCheckoutUrl();
  const soldOut = reservation.remainingSlots === 0;
  const canBook = Boolean(checkoutUrl) && !soldOut;
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

        <div className="reservation-art" aria-label={`Studio reservation, $${reservation.amountUsd}, fully credited toward your project deposit`}>
          <div className="reservation-material-fallback" aria-hidden="true"><i /><i /></div>
          <ReservationOptics paused={paused} reducedMotion={reducedMotion} />
          <div className="reservation-pass">
            <span className="reservation-pass-brand">AICANFEEL <span>STUDIO RESERVATION</span></span>
            <p className="reservation-price"><span>$</span>{reservation.amountUsd}<span>USD</span></p>
            <p className="reservation-pass-note">A place for <em>your music.</em></p>
            <div className="reservation-pass-credit"><Check size={15} strokeWidth={1.5} aria-hidden="true" /><span>100% toward your deposit</span></div>
            <span className="reservation-pass-edge" aria-hidden="true" />
          </div>
        </div>

        <div className="reservation-action" data-reveal>
          <div className="reservation-credit-copy">
            <span className="reservation-credit-mark" aria-hidden="true"><Check size={17} strokeWidth={1.6} /></span>
            <p><strong>Fully credited to your deposit.</strong><span>The full $99 goes toward your project deposit. You’re not paying anything extra.</span></p>
          </div>
          {canBook && checkoutUrl ? (
            <a className="reservation-book" href={checkoutUrl} target="_blank" rel="noopener noreferrer" data-press data-scan="contact" data-scan-id="reservation-checkout">
              <span>Book my slot <span>— ${reservation.amountUsd}</span></span><ArrowUpRight size={21} strokeWidth={1.6} data-scan-port />
            </a>
          ) : (
            <button className="reservation-book" disabled aria-describedby="reservation-checkout-note">
              <span>{soldOut ? 'All slots reserved' : 'Book my slot'}{!soldOut && <span> — ${reservation.amountUsd}</span>}</span><LockKeyhole size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
          <p id="reservation-checkout-note" className="reservation-checkout-note">
            {soldOut ? 'Email us about the next intake.' : canBook ? 'Continue to payment to reserve your slot.' : 'Booking opens soon. Online checkout isn’t available yet.'}
          </p>
        </div>
      </div>
    </section>
  );
}
