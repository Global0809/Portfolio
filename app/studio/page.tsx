'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
type Reservation = {
  id: string;
  artist: string;
  email: string;
  song: string;
  mood: string;
  link: string;
  vision: string;
  inspiration: string;
  status: string;
  slot: number;
  hold_expires: number;
};
export default function StudioInbox() {
  const [key, setKey] = useState(''),
    [rows, setRows] = useState<Reservation[] | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  async function call(path: string, body?: unknown) {
    const r = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await r.json()) as {
      error?: string;
      reservations: Reservation[];
    };
    if (!r.ok) throw new Error(data.error || 'Please try again.');
    return data;
  }
  async function refresh() {
    setBusy(true);
    setError('');
    try {
      setRows((await call('/api/studio/reservations')).reservations);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function update(id: string, action: string) {
    setBusy(true);
    setError('');
    try {
      await call('/api/studio/reservations', { id, action });
      setRows((await call('/api/studio/reservations')).reservations);
      setNotice(
        action === 'start'
          ? 'Project marked as started. The hold will no longer expire.'
          : 'Project marked as complete.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function retry() {
    setBusy(true);
    setError('');
    try {
      await call('/api/studio/email-retry', {});
      setNotice(
        'Delivery recovery attempted. Check your email provider for delivery and bounce status.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="studio-inbox">
      <a className="reservation-home" href="/">
        <ArrowLeft size={16} /> Back to music videos
      </a>
      <p className="eyebrow">AICANFEEL / STUDIO ONLY</p>
      <h1>
        The next
        <br />
        <em>chapter.</em>
      </h1>
      <p className="inbox-intro">Artist reservations and project starts.</p>
      {!rows ? (
        <form
          className="studio-login"
          onSubmit={(e) => {
            e.preventDefault();
            void refresh();
          }}
        >
          <label>
            Studio access key
            <Input
              type="password"
              required
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </label>
          <button className="booking-submit" disabled={busy}>
            {busy ? 'Opening…' : 'Open reservations'}
          </button>
          <p className="privacy-note">
            The key is kept in memory for this page only.
          </p>
        </form>
      ) : (
        <>
          <div className="studio-toolbar">
            <button onClick={() => void refresh()} disabled={busy}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={() => void retry()} disabled={busy}>
              Retry delayed emails
            </button>
            <button
              onClick={() => {
                setKey('');
                setRows(null);
                setNotice('');
              }}
            >
              Lock studio
            </button>
          </div>
          {rows.length === 0 && <p>No reservations yet.</p>}
          <div className="studio-reservations">
            {rows.map((row) => (
              <article key={row.id}>
                <div className="inbox-row">
                  <span className="eyebrow">
                    PLACE {String(row.slot).padStart(2, '0')}
                  </span>
                  <span className="inbox-status">{row.status}</span>
                </div>
                <h2>{row.artist}</h2>
                <p className="inbox-song">
                  {row.song} · {row.mood}
                </p>
                <a href={`mailto:${row.email}`}>
                  {row.email}
                  <ArrowUpRight size={14} />
                </a>
                {row.link && (
                  <a href={row.link} target="_blank" rel="noopener noreferrer">
                    Open artist’s track
                    <ArrowUpRight size={14} />
                  </a>
                )}
                {row.vision && <p>{row.vision}</p>}
                <small>Inspiration: {row.inspiration || 'Not selected'}</small>
                {row.status === 'reserved' && (
                  <>
                    <p>
                      Held until{' '}
                      {new Date(row.hold_expires * 1000).toLocaleString()}
                    </p>
                    <button
                      className="booking-submit"
                      disabled={busy}
                      onClick={() => void update(row.id, 'start')}
                    >
                      Confirm project has started
                    </button>
                  </>
                )}
                {row.status === 'started' && (
                  <button
                    className="booking-submit"
                    disabled={busy}
                    onClick={() => void update(row.id, 'complete')}
                  >
                    Mark project complete
                  </button>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </main>
  );
}
