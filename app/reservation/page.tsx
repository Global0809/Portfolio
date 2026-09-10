'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Mail } from 'lucide-react';
type Reservation = {
  artist: string;
  song: string;
  mood: string;
  status: string;
  expiresAt: string;
  emailSent: boolean | null;
  manageToken: string | null;
  replyTo: string;
};
export default function ReservationPage() {
  const [token, setToken] = useState(''),
    [data, setData] = useState<Reservation | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(true),
    [cancelConfirm, setCancelConfirm] = useState(false);
  async function action(name: string, t = token) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t, action: name }),
      });
      const result = (await response.json()) as Reservation & {
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || 'Please try again.');
      setData(result);
      if (result.manageToken) {
        setToken(result.manageToken);
        history.replaceState(
          null,
          '',
          `#token=${encodeURIComponent(result.manageToken)}`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const value =
      new URLSearchParams(location.hash.slice(1)).get('token') || '';
    setToken(value);
    if (value) void action('inspect', value);
    else {
      setError('Open the personal link in your AICANFEEL email.');
      setBusy(false);
    }
  }, []);
  const active = data?.status === 'reserved' || data?.status === 'started';
  return (
    <main className="reservation-page">
      <a className="wordmark" href="/">
        AICANFEEL<span className="brand-mark">*</span>
      </a>
      <section className="reservation-card">
        <span className="mail-orbit">
          {active ? <Check size={30} /> : <Mail size={30} />}
        </span>
        <p className="eyebrow">YOUR PERSONAL STUDIO INVITATION</p>
        <h1>
          {data ? (
            <>
              {active ? 'A place for' : 'Hello,'}
              <br />
              <em>{data.artist}.</em>
            </>
          ) : (
            <>
              Your next
              <br />
              <em>chapter.</em>
            </>
          )}
        </h1>
        {data && (
          <>
            <div className="personal-pass">
              <span className="pass-overline">AICANFEEL / ARTIST EDITION</span>
              <strong>{data.song}</strong>
              <span>{data.mood}</span>
            </div>
            <p>
              {data.status === 'pending'
                ? 'One final step: confirm your email to activate your personal reservation.'
                : active
                  ? 'Your creative brief has a place in the studio. Reply to your confirmation email with your track and preferred timing.'
                  : data.status === 'cancelled'
                    ? 'Your reservation has been cancelled and the place released.'
                    : 'This reservation has expired. You can check the studio for new availability.'}
            </p>
            {['pending', 'reserved'].includes(data.status) && (
              <p className="reservation-deadline">
                <Clock3 size={17} />
                {data.status === 'pending' ? 'Confirm by' : 'Held until'}{' '}
                {new Date(data.expiresAt).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {busy && <p role="status">Opening your invitation…</p>}
        {data?.status === 'pending' && (
          <button
            className="booking-submit"
            disabled={busy}
            onClick={() => void action('confirm')}
          >
            Confirm my email & reserve
            <ArrowRight size={18} />
          </button>
        )}
        {active && data?.replyTo && (
          <a
            className="booking-submit"
            href={`mailto:${data.replyTo}?subject=${encodeURIComponent(`My AICANFEEL project — ${data.song}`)}`}
          >
            Let’s start the conversation
            <ArrowRight size={18} />
          </a>
        )}
        {data?.emailSent === false && (
          <p className="privacy-note">
            Your reservation is saved. Email delivery is delayed.{' '}
            <button onClick={() => void action('resend')} disabled={busy}>
              Retry the confirmation email
            </button>
          </p>
        )}
        {data?.status === 'reserved' &&
          (cancelConfirm ? (
            <div className="cancel-confirm">
              <p>Release your place? This cannot be undone.</p>
              <button onClick={() => void action('cancel')} disabled={busy}>
                Yes, release my place
              </button>
              <button onClick={() => setCancelConfirm(false)}>
                Keep my reservation
              </button>
            </div>
          ) : (
            <button
              className="cancel-link"
              onClick={() => setCancelConfirm(true)}
            >
              Release my place
            </button>
          ))}
        <a className="reservation-home" href="/">
          <ArrowLeft size={16} /> Back to music videos
        </a>
      </section>
    </main>
  );
}
