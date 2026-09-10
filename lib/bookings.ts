import { env } from 'cloudflare:workers';

export type BookingEnv = {
  DB: D1Database;
  BOOKING_ENABLED?: string;
  BOOKING_HOLD_HOURS?: string;
  BOOKING_SIGNING_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_REPLY_TO?: string;
  SITE_ORIGIN?: string;
  BOOKING_ADMIN_KEY?: string;
};
export const environment = () => env as unknown as BookingEnv;
export const managementReady = (e: BookingEnv) =>
  !!e.DB && !!e.BOOKING_SIGNING_SECRET;
export const settings = (e: BookingEnv) => ({
  enabled:
    e.BOOKING_ENABLED === 'true' &&
    !!e.DB &&
    !!e.RESEND_API_KEY &&
    !!e.EMAIL_FROM &&
    !!e.EMAIL_REPLY_TO &&
    !!e.BOOKING_SIGNING_SECRET &&
    !!e.SITE_ORIGIN &&
    Number(e.BOOKING_HOLD_HOURS) > 0,
  holdHours: Number(e.BOOKING_HOLD_HOURS) || 48,
  capacity: 7,
});
export const now = () => Math.floor(Date.now() / 1000);
export const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
export function mutationAllowed(request: Request, e: BookingEnv) {
  const origin = request.headers.get('Origin');
  return (
    origin === new URL(request.url).origin ||
    (!!e.SITE_ORIGIN && origin === e.SITE_ORIGIN)
  );
}
export async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
export async function token(
  id: string,
  purpose: string,
  expires: number,
  e: BookingEnv,
) {
  const payload = btoa(JSON.stringify({ id, purpose, expires }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  return `${payload}.${await hmac(payload, e.BOOKING_SIGNING_SECRET!)}`;
}
export async function readToken(value: string, e: BookingEnv) {
  if (value.length > 1000) return null;
  try {
    const [data, signature] = value.split('.');
    const expected = await hmac(data, e.BOOKING_SIGNING_SECRET!);
    if (!signature || signature.length !== expected.length) return null;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++)
      mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
    if (mismatch) return null;
    const payload = JSON.parse(
      atob(data.replaceAll('-', '+').replaceAll('_', '/')),
    ) as { id: string; purpose: string; expires: number };
    return payload.expires > now() ? payload : null;
  } catch {
    return null;
  }
}
export type Booking = {
  id: string;
  request_key: string;
  request_hash: string;
  slot: number;
  email: string;
  email_hash: string;
  artist: string;
  song: string;
  mood: string;
  link: string;
  vision: string;
  inspiration: string;
  status: string;
  verify_expires: number;
  hold_expires: number;
  created_at: number;
};
export const expire = (db: D1Database) =>
  db
    .prepare(
      "UPDATE bookings SET status='expired' WHERE (status='pending' AND verify_expires<=?) OR (status='reserved' AND hold_expires<=?)",
    )
    .bind(now(), now());
export async function availability(e: BookingEnv) {
  const conf = settings(e);
  if (!conf.enabled)
    return { enabled: false, remaining: null, capacity: 7, holdHours: null };
  const row = await e.DB.prepare(
    "SELECT COUNT(*) AS occupied FROM bookings WHERE status IN ('started','completed') OR (status='pending' AND verify_expires>?) OR (status='reserved' AND hold_expires>?)",
  )
    .bind(now(), now())
    .first<{ occupied: number }>();
  return {
    enabled: true,
    remaining: Math.max(0, 7 - (row?.occupied || 0)),
    capacity: 7,
    holdHours: conf.holdHours,
  };
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
export async function deliverEmail(
  booking: Booking,
  kind: 'verify' | 'confirmed',
  e: BookingEnv,
) {
  if (!e.RESEND_API_KEY || !e.EMAIL_FROM || !e.EMAIL_REPLY_TO || !e.SITE_ORIGIN)
    return false;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await attemptEmail(booking, kind, e)) return true;
    if (attempt < 2)
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  return false;
}
async function attemptEmail(
  booking: Booking,
  kind: 'verify' | 'confirmed',
  e: BookingEnv,
) {
  const eventId = `${kind}/${booking.id}/v1`,
    timestamp = now();
  await e.DB.prepare(
    "INSERT INTO email_events(id,booking_id,kind,status,created_at) VALUES(?,?,?,'queued',?) ON CONFLICT(id) DO NOTHING",
  )
    .bind(eventId, booking.id, kind, timestamp)
    .run();
  const event = await e.DB.prepare(
    'SELECT status,created_at FROM email_events WHERE id=?',
  )
    .bind(eventId)
    .first<{ status: string; created_at: number }>();
  if (event?.status === 'sent') return true;
  // Provider deduplication lasts 24h: leave older uncertain sends for studio review.
  if (!event || timestamp - event.created_at >= 23 * 3600) return false;
  const claim = await e.DB.prepare(
    "UPDATE email_events SET status='sending',lease_until=?,attempts=attempts+1 WHERE id=? AND status!='sent' AND lease_until<?",
  )
    .bind(timestamp + 45, eventId, timestamp)
    .run();
  if (!claim.meta.changes) return false;
  const expiry =
    kind === 'verify' ? booking.verify_expires : booking.hold_expires;
  const signed = await token(
    booking.id,
    kind === 'verify' ? 'verify' : 'manage',
    expiry,
    e,
  );
  const url = `${e.SITE_ORIGIN}/reservation#token=${encodeURIComponent(signed)}`;
  const deadline = new Date(expiry * 1000).toUTCString();
  const subject =
    kind === 'verify'
      ? `${booking.artist}, your next world is waiting`
      : `Your AICANFEEL place is reserved, ${booking.artist}`;
  const heading =
    kind === 'verify' ? 'A place for your sound.' : 'Your place is yours.';
  const message =
    kind === 'verify'
      ? `We’re holding a studio place for “${booking.song}” while you confirm your email. Confirm by ${deadline} to activate your ${settings(e).holdHours}-hour reservation.`
      : `Your place for “${booking.song}” is reserved until ${deadline}. Reply to this email with your track and preferred start timing so we can agree the brief and next steps. If the studio has not confirmed your project start by the deadline, this hold will be released. Scope, price, and production dates are agreed separately.`;
  const text = `AICANFEEL\n\n${heading}\n\nHi ${booking.artist},\n\n${message}\n\nYour direction: ${booking.mood}\n${booking.link ? `Your track: ${booking.link}\n` : ''}\n${kind === 'verify' ? 'Confirm your email' : 'View or cancel your reservation'}: ${url}\n\nIf this wasn’t you, ignore this message. No marketing subscription has been created.`;
  const html = `<!doctype html><html><body style="margin:0;background:#060709;color:#f2f3f3;font-family:Arial,sans-serif"><div style="max-width:540px;margin:0 auto;padding:48px 28px"><p style="font-size:13px;letter-spacing:3px;color:#aeb5bc">AICANFEEL / ARTIST EDITION</p><h1 style="font-family:Georgia,serif;font-size:44px;font-weight:400;line-height:1.1">${heading}</h1><p>Hi ${escape(booking.artist)},</p><p style="font-size:16px;line-height:1.8;color:#bdc5cc">${escape(message)}</p><div style="border:1px solid #5b6a76;border-radius:18px;padding:25px;margin:30px 0"><p style="font-size:12px;color:#bdc5cc">YOUR NEXT RELEASE</p><h2>${escape(booking.song)}</h2><p>${escape(booking.mood)}</p></div><a href="${escape(url)}" style="display:inline-block;border-radius:28px;background:#d6e0e8;color:#111820;padding:17px 26px;text-decoration:none;font-weight:bold">${kind === 'verify' ? 'Confirm my place' : 'View my reservation'} →</a><p style="color:#9ba2a8;font-size:12px;line-height:1.7;margin-top:35px">If this wasn’t you, ignore this message. No marketing subscription has been created.</p></div></body></html>`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${e.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': eventId,
      },
      body: JSON.stringify({
        from: e.EMAIL_FROM,
        to: [booking.email],
        reply_to: e.EMAIL_REPLY_TO,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok)
      throw new Error('Email provider did not accept the message');
    const result = (await response.json()) as { id: string };
    await e.DB.prepare(
      "UPDATE email_events SET status='sent',provider_id=?,lease_until=0 WHERE id=?",
    )
      .bind(result.id, eventId)
      .run();
    return true;
  } catch {
    await e.DB.prepare(
      "UPDATE email_events SET status='retry',lease_until=0 WHERE id=? AND status!='sent'",
    )
      .bind(eventId)
      .run();
    return false;
  }
}
