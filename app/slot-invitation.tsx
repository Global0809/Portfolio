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
          <span>AICANFEEL / PROJECT INTAKE</span>
          <span className="intake-status">
            <i />
            {full ? 'INTAKE FULL' : live ? 'BOOKING OPEN' : 'LIMITED INTAKE'}
          </span>
        </div>
        <div className="intake-layout">
          <div
            className="intake-capacity"
            aria-label={
              live
                ? `${count} slots left out of ${availability.capacity}`
                : `${availability.capacity} projects per intake`
            }
          >
            <strong className="intake-number">
              {String(count).padStart(2, '0')}
            </strong>
            <span className="intake-unit">
              {live ? 'slots left' : 'projects per intake'}
            </span>
            <div className="intake-marks" aria-hidden="true">
              {Array.from({ length: availability.capacity }, (_, i) => (
                <i key={i} data-available={live && i < count} />
              ))}
            </div>
            <span className="intake-limit">
              {live
                ? `of ${availability.capacity} studio slots`
                : 'A small intake. A dedicated focus.'}
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
                  {live ? 'Hold your slot.' : 'Make the next'}
                  <br />
                  <em>{live ? 'Start your film.' : 'slot yours.'}</em>
                </>
              )}
            </h2>
            <p className="intake-description">
              {full
                ? 'Have a track lined up? Send your brief for the next intake.'
                : live
                  ? 'A limited place for your track. Reserve it now, then shape the film with us.'
                  : 'Seven projects per intake. If your track is ready, request your place for a CGI / VFX music video.'}
            </p>
            <button
              className="booking-submit intake-submit"
              data-press
              data-scan="book"
              data-scan-id="intake-request"
              onClick={onStart}
            >
              <span>
                {full
                  ? 'Request the next intake'
                  : live
                    ? 'Hold my slot'
                    : 'Request my slot'}
              </span>
              <ArrowUpRight size={21} strokeWidth={1.7} />
            </button>
            <div className="intake-deadline">
              {live && !full ? <Clock3 size={14} /> : <Mail size={14} />}
              <span>
                {live && !full
                  ? `Confirm by email for a ${availability.holdHours}-hour hold.`
                  : 'Email request · Studio confirmation required'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
