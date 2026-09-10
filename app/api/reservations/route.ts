import {
  Booking,
  deliverEmail,
  environment,
  expire,
  hmac,
  json,
  mutationAllowed,
  now,
  settings,
} from '@/lib/bookings';
export async function POST(request: Request) {
  const e = environment();
  if (!mutationAllowed(request, e))
    return json({ error: 'Please submit from the studio website.' }, 403);
  if (!settings(e).enabled)
    return json({ error: 'Reservations are not open yet.' }, 503);
  if (!request.headers.get('Content-Type')?.includes('application/json'))
    return json({ error: 'Invalid request.' }, 415);
  const raw = await request.text();
  if (raw.length > 8000)
    return json({ error: 'Please shorten your project details.' }, 413);
  let fields: Record<string, unknown>;
  try {
    fields = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (!fields || typeof fields !== 'object' || Array.isArray(fields))
    return json({ error: 'Invalid request.' }, 400);
  const field = (name: string, max: number) =>
    typeof fields[name] === 'string'
      ? (fields[name] as string).trim().slice(0, max)
      : '';
  const artist = field('artist', 80),
    email = field('email', 254).toLowerCase(),
    song = field('song', 100),
    mood = field('mood', 40),
    link = field('link', 1000),
    vision = field('vision', 1200),
    inspiration = field('inspiration', 80);
  if (
    fields.website ||
    artist.length < 2 ||
    !song ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !['Cinematic', 'Surreal', 'Romantic', 'High energy'].includes(mood) ||
    /[\x00-\x1f]/.test(artist + song)
  )
    return json(
      { error: 'Please check your name, email, and track title.' },
      400,
    );
  if (link) {
    try {
      if (!['https:', 'http:'].includes(new URL(link).protocol))
        throw new Error();
    } catch {
      return json(
        { error: 'Please use a valid track link beginning with https://.' },
        400,
      );
    }
  }
  const requestKey = request.headers.get('Idempotency-Key') || '';
  if (!/^[a-zA-Z0-9-]{20,80}$/.test(requestKey))
    return json({ error: 'Please refresh and try again.' }, 400);
  const secret = e.BOOKING_SIGNING_SECRET!,
    emailHash = await hmac(email, secret),
    ipHash = await hmac(
      request.headers.get('CF-Connecting-IP') || 'local-development',
      secret,
    ),
    requestHash = await hmac(
      JSON.stringify({ artist, email, song, mood, link, vision, inspiration }),
      secret,
    );
  try {
    let booking = await e.DB.prepare(
      'SELECT * FROM bookings WHERE request_key=?',
    )
      .bind(requestKey)
      .first<Booking>();
    if (booking && booking.request_hash !== requestHash)
      return json(
        { error: 'Your brief changed. Please reopen the form and try again.' },
        409,
      );
    if (!booking) {
      const id = crypto.randomUUID(),
        timestamp = now(),
        verifyExpires = timestamp + 15 * 60,
        holdExpires = timestamp + settings(e).holdHours * 3600;
      const rows = await e.DB.batch([
        expire(e.DB),
        e.DB.prepare(`WITH RECURSIVE places(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM places WHERE n<7)
     INSERT INTO bookings(id,request_key,request_hash,slot,email,email_hash,ip_hash,artist,song,mood,link,vision,inspiration,status,verify_expires,hold_expires,created_at)
     SELECT ?,?,?,n,?,?,?,?,?,?,?,?,?,'pending',?,?,? FROM places
     WHERE NOT EXISTS(SELECT 1 FROM bookings WHERE slot=n AND status IN ('pending','reserved','started','completed'))
     AND NOT EXISTS(SELECT 1 FROM bookings WHERE email_hash=? AND status IN ('pending','reserved','started'))
     AND (SELECT COUNT(*) FROM bookings WHERE ip_hash=? AND created_at>?)<3
     ORDER BY n LIMIT 1`).bind(
          id,
          requestKey,
          requestHash,
          email,
          emailHash,
          ipHash,
          artist,
          song,
          mood,
          link,
          vision,
          inspiration,
          verifyExpires,
          holdExpires,
          timestamp,
          emailHash,
          ipHash,
          timestamp - 3600,
        ),
        e.DB.prepare(
          "INSERT INTO email_events(id,booking_id,kind,status,created_at) SELECT ?,id,'verify','queued',? FROM bookings WHERE id=? ON CONFLICT(id) DO NOTHING",
        ).bind(`verify/${id}/v1`, timestamp, id),
        e.DB.prepare('SELECT * FROM bookings WHERE request_key=?').bind(
          requestKey,
        ),
      ]);
      booking = (rows[3].results[0] as unknown as Booking) || null;
      if (!booking)
        return json(
          {
            error:
              'We can’t hold another place right now. If you already requested one, check your inbox; otherwise try again later.',
          },
          409,
        );
    }
    if (booking.request_hash !== requestHash)
      return json(
        { error: 'Your brief changed. Please reopen the form and try again.' },
        409,
      );
    if (booking.status !== 'pending' || booking.verify_expires <= now())
      return json(
        {
          error:
            'This request is no longer awaiting confirmation. Check your inbox for your reservation link, or start a fresh request.',
        },
        409,
      );
    const sent = await deliverEmail(booking, 'verify', e);
    if (!sent)
      return json(
        {
          error:
            'Your place is temporarily held, but the invitation email has not been accepted yet. Please retry with this form.',
        },
        502,
      );
    return json(
      {
        ok: true,
        verifyBefore: new Date(booking.verify_expires * 1000).toISOString(),
      },
      201,
    );
  } catch {
    return json(
      {
        error:
          'The reservation service is temporarily unavailable. Your existing reservations are safe; please try again.',
      },
      503,
    );
  }
}
