'use client';

import { ArrowUpRight, Clock3, Mail } from 'lucide-react';
import type { Availability } from './booking';

export function SlotInvitation({
  availability,
  onStart,
}: {
  availability: Availability;
  onStart: () => void;
}) {
  const live = availability.enabled && availability.remaining !== null;
  const full = live && availability.remaining === 0;
  const count = live ? availability.remaining! : availability.capacity;
  return (
    <section
      className="booking-invitation slot-section"
      id="create"
      aria-label="Request a music video slot"
    >
      <div
        className="invitation-glass liquid-panel intake-panel"
        data-reveal
        data-intake-state={full ? 'full' : live ? 'open' : 'requests'}
      >
        <div className="intake-header">
          <span>MUSIC VIDEO BOOKINGS</span>
          <span className="intake-status">
            <i />
            {full ? 'FULLY BOOKED' : 'LIMITED SLOTS'}
          </span>
        </div>
        <div className="intake-layout">
          <div
            className="intake-capacity"
            aria-label={
              live
                ? `${count} slots left out of ${availability.capacity}`
                : `Only ${availability.capacity} slots per intake`
            }
          >
            <strong className="intake-number">
              {String(count).padStart(2, '0')}
            </strong>
            <span className="intake-unit">
              {live ? 'slots left' : 'slots per intake'}
            </span>
            <div className="intake-marks" aria-hidden="true" data-parallax="6">
              {Array.from({ length: availability.capacity }, (_, i) => (
                <i
                  key={i}
                  data-available={i < count}
                  style={{ '--slot-index': i } as React.CSSProperties}
                />
              ))}
            </div>
            <span className="intake-limit">
              {live
                ? `of ${availability.capacity} studio slots`
                : 'Limited capacity. Bookings confirmed by the studio.'}
            </span>
          </div>
          <div className="intake-action">
            <h2>
              {full ? (
                <>
                  This intake
                  <br />
                  <em>is full.</em>
                </>
              ) : (
                <>
                  {live ? 'Book your slot.' : 'Limited slots.'}
                  <br />
                  <em>
                    {live ? 'Create your music video.' : 'Make one yours.'}
                  </em>
                </>
              )}
            </h2>
            <p className="intake-description">
              {full
                ? 'Have a track lined up? Send your brief for the next intake.'
                : live
                  ? 'Reserve a place for your CGI + VFX music video before this intake fills.'
                  : 'We take on just 7 music videos per intake. Send your request to get your track into our schedule.'}
            </p>
            <button
              className="booking-submit intake-submit"
              data-press
              data-scan="book"
              data-scan-id="intake-request"
              onClick={onStart}
            >
              <span>{full ? 'Request the next intake' : 'Book my slot'}</span>
              <ArrowUpRight size={21} strokeWidth={1.7} />
            </button>
            <div className="intake-deadline">
              {live && !full ? <Clock3 size={14} /> : <Mail size={14} />}
              <span>
                {live && !full
                  ? `Confirm by email for a ${availability.holdHours}-hour hold.`
                  : 'Three details to start. We confirm your slot by email.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
