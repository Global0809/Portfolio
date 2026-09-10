'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Mail,
  Music2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { studio } from './studio-config';

export type Availability = {
  enabled: boolean;
  remaining: number | null;
  capacity: number;
  holdHours: number | null;
};
export const unavailable: Availability = {
  enabled: false,
  remaining: null,
  capacity: 7,
  holdHours: null,
};
export function useAvailability() {
  const [availability, setAvailability] = useState<Availability>(unavailable);
  const refresh = async () => {
    try {
      const response = await fetch('/api/availability', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      setAvailability(await response.json());
    } catch {
      setAvailability(unavailable);
    }
  };
  useEffect(() => {
    void refresh();
    const refreshWhenVisible = () => {
      if (!document.hidden) void refresh();
    };
    const interval = setInterval(refreshWhenVisible, 45000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);
  return { availability, refresh };
}

export function BookingDialog({
  open,
  onOpenChange,
  availability,
  onReserved,
  inspiration,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availability: Availability;
  onReserved: () => void;
  inspiration: string;
}) {
  const [step, setStep] = useState(0),
    [artist, setArtist] = useState(''),
    [email, setEmail] = useState(''),
    [song, setSong] = useState(''),
    [mood, setMood] = useState('Cinematic'),
    [website, setWebsite] = useState('');
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [expiry, setExpiry] = useState('');
  const requestKey = useRef('');
  const title = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [emailOpened, setEmailOpened] = useState(false);
  useEffect(() => {
    setSaved(false);
    setEmailOpened(false);
  }, [artist, email, song, mood]);
  const moods = ['Cinematic', 'Surreal', 'Romantic', 'High energy'];
  const moodNotes = [
    'Light & scale',
    'Beyond reality',
    'Intimate & luminous',
    'Rhythm & impact',
  ];
  const moodIndex = moods.indexOf(mood);
  useEffect(() => {
    if (open) {
      setError('');
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    panel.current?.scrollTo({ top: 0 });
    title.current?.focus({ preventScroll: true });
  }, [step, open, sent]);
  function next(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setStep((s) => s + 1);
  }
  async function reserve(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!availability.enabled) {
      setError('Reservations are not open yet. Your brief is ready to save.');
      return;
    }
    setBusy(true);
    requestKey.current ||= crypto.randomUUID();
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': requestKey.current,
        },
        body: JSON.stringify({
          artist,
          email,
          song,
          mood,
          inspiration,
          website,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        verifyBefore: string;
      };
      if (!response.ok)
        throw new Error(
          data.error || 'We couldn’t reserve your place. Please try again.',
        );
      setSent(true);
      setExpiry(data.verifyBefore);
      onReserved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  function saveBrief() {
    const text = `AICANFEEL — A music video for ${artist || 'your next release'}\n\nArtist: ${artist}\nSong: ${song}\nEmail: ${email}\nDirection: ${mood}\nInspiration: ${inspiration}\n\nThis is a creative brief, not a reservation.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-aicanfeel-brief.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaved(true);
  }
  function emailRequest() {
    const subject = `Music video slot request — ${artist.trim()} / ${song.trim()}`;
    const body = `Hi AICANFEEL,\n\nI'd like to request a music-video slot.\n\nArtist: ${artist.trim()}\nTrack: ${song.trim()}\nReply email: ${email.trim()}\nDirection: ${mood}\nMusic video inspiration: ${inspiration}\n\nPlease confirm availability and the next steps for my project.\n`;
    const anchor = document.createElement('a');
    anchor.href = `mailto:${studio.bookingEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    anchor.click();
    setEmailOpened(true);
  }
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      disablePointerDismissal={busy}
    >
      <DialogContent
        ref={panel}
        initialFocus={title}
        showCloseButton={false}
        className="booking-dialog quick-booking liquid-panel artist-booking"
        data-mood={moodIndex}
      >
        <button
          className="booking-close icon-button"
          aria-label="Close booking"
          onClick={() => onOpenChange(false)}
          disabled={busy}
        >
          <X size={20} />
        </button>
        {!sent ? (
          <>
            <div className="booking-topline">
              <span className="eyebrow">
                {availability.enabled
                  ? 'RESERVE A STUDIO SLOT'
                  : 'YOUR SLOT REQUEST'}
              </span>
              <span className="booking-step">0{step + 1} / 02</span>
            </div>
            <div className="booking-progress" aria-hidden="true">
              {[0, 1].map((n) => (
                <i key={n} className={n <= step ? 'passed' : ''} />
              ))}
            </div>
            <DialogTitle ref={title} tabIndex={-1} className="booking-title">
              {step === 0 ? 'Start with your track.' : 'Choose the feeling.'}
            </DialogTitle>
            <DialogDescription className="booking-description">
              {step === 0
                ? 'Just three details. We’ll shape the rest together.'
                : 'One starting point. We’ll shape your music video together.'}
            </DialogDescription>
            {step === 1 && (
              <div className="personal-pass compact-pass artist-pass">
                <div className="pass-optics" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <i key={n} style={{ '--ring': n } as React.CSSProperties} />
                  ))}
                </div>
                <span className="pass-overline">
                  AICANFEEL / ARTIST EDITION
                </span>
                <span className="pass-for">
                  A music video for {artist.trim()}.
                </span>
                <strong>{song.trim() || 'Your next release'}</strong>
                <div className="pass-bottom">
                  <span key={mood}>
                    {mood} <span> / {moodNotes[moodIndex]}</span>
                  </span>
                  <Music2 size={16} aria-hidden="true" />
                </div>
              </div>
            )}
            <form
              onSubmit={
                step === 0
                  ? next
                  : availability.enabled
                    ? reserve
                    : (e) => {
                        e.preventDefault();
                        emailRequest();
                      }
              }
              className="booking-form"
              key={step}
            >
              {step === 0 ? (
                <>
                  <label>
                    Artist / stage name
                    <Input
                      value={artist}
                      onChange={(e) => {
                        setArtist(e.target.value);
                        requestKey.current = '';
                      }}
                      placeholder="What do you go by?"
                      required
                      minLength={2}
                      maxLength={80}
                      autoComplete="nickname"
                    />
                  </label>
                  <label>
                    Your email
                    <Input
                      type="email"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        requestKey.current = '';
                      }}
                      placeholder="you@example.com"
                      required
                      maxLength={254}
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    Track / release title
                    <Input
                      value={song}
                      onChange={(e) => {
                        setSong(e.target.value);
                        requestKey.current = '';
                      }}
                      placeholder="Even a working title is perfect"
                      required
                      maxLength={100}
                      enterKeyHint="next"
                    />
                  </label>
                </>
              ) : (
                <>
                  <fieldset>
                    <legend className="sr-only">
                      The feeling you’re chasing
                    </legend>
                    <RadioGroup
                      value={mood}
                      onValueChange={(value) => {
                        setMood(String(value));
                        requestKey.current = '';
                      }}
                      className="mood-options"
                      aria-label="Visual direction"
                    >
                      {moods.map((m, i) => (
                        <label key={m} className={mood === m ? 'chosen' : ''}>
                          <RadioGroupItem value={m} />
                          <span
                            className="mood-symbol"
                            data-symbol={i}
                            aria-hidden="true"
                          >
                            <i />
                            <i />
                            <i />
                          </span>
                          <span className="mood-name">
                            {m}
                            <small>{moodNotes[i]}</small>
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  </fieldset>
                  <div className="reservation-terms">
                    <Clock3 size={18} />
                    <p>
                      {availability.enabled
                        ? `Confirm your email to hold a place for ${availability.holdHours} hours. Your email will show the exact expiry and next step.`
                        : 'Your track. Your direction. The studio confirms your slot and next steps by email.'}
                    </p>
                  </div>
                  <p className="privacy-note">
                    {availability.enabled
                      ? 'We use your details to respond about this project and manage your reservation. No newsletter signup.'
                      : `Opens your email app to ${studio.bookingEmail}. Review, then send.`}
                  </p>
                  <label className="honeypot" aria-hidden="true">
                    Website
                    <Input
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </>
              )}
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <div className="booking-actions">
                {step > 0 && (
                  <button
                    type="button"
                    className="back-step"
                    onClick={() => {
                      setStep((s) => s - 1);
                      setError('');
                    }}
                    disabled={busy}
                  >
                    <ArrowLeft size={17} />
                    <span>Back</span>
                  </button>
                )}
                {step === 0 ? (
                  <button data-press className="booking-submit" type="submit">
                    Next: the feeling
                    <ArrowRight size={18} />
                  </button>
                ) : availability.enabled ? (
                  <button
                    data-press
                    className="booking-submit"
                    type="submit"
                    disabled={busy || availability.remaining === 0}
                  >
                    {busy
                      ? 'Holding your place…'
                      : availability.remaining === 0
                        ? 'This release is full'
                        : 'Reserve my place'}
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button data-press className="booking-submit" type="submit">
                    {emailOpened ? 'Open email again' : 'Email my slot request'}
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
              {!availability.enabled && step === 1 && (
                <div className="brief-delivery">
                  {emailOpened && (
                    <p role="status">
                      Send your email to complete the request. A slot is held
                      only after studio confirmation.
                    </p>
                  )}
                  <button
                    type="button"
                    className="brief-download"
                    onClick={saveBrief}
                  >
                    {saved ? 'Download brief again' : 'Download a copy'}
                  </button>
                  {emailOpened && (
                    <p className="email-fallback">
                      Email didn’t open? Download your brief and send it to{' '}
                      {studio.bookingEmail}.
                    </p>
                  )}
                </div>
              )}
              {saved && !availability.enabled && step === 1 && (
                <p className="brief-saved" role="status">
                  <Check size={16} /> Your brief is ready in your downloads. No
                  place has been reserved.
                </p>
              )}
              {step === 1 && availability.enabled && (
                <span className="commitment-note">
                  A reservation is an intake hold. Scope, price, and production
                  start are agreed with the studio.
                </span>
              )}
            </form>
          </>
        ) : (
          <div className="booking-success">
            <span className="mail-orbit">
              <Mail size={30} />
              <Check size={15} />
            </span>
            <p className="eyebrow">YOUR INVITATION IS ON ITS WAY</p>
            <DialogTitle ref={title} tabIndex={-1} className="booking-title">
              Check your inbox,
              <br />
              <em>{artist}.</em>
            </DialogTitle>
            <DialogDescription className="booking-description">
              We sent your personal invitation to {email}. Confirm your email to
              secure the reservation for “{song}”.
            </DialogDescription>
            <p className="confirmation-deadline">
              Confirm by{' '}
              {new Date(expiry).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
              . Until then, your place is temporarily held.
            </p>
            <button
              data-press
              className="booking-submit"
              onClick={() => onOpenChange(false)}
            >
              Back to music videos
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
