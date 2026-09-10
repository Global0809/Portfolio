import {
  Booking,
  deliverEmail,
  environment,
  expire,
  json,
  mutationAllowed,
  now,
  readToken,
  managementReady,
  token,
} from '@/lib/bookings';
export async function POST(request: Request) {
  const e = environment();
  if (!mutationAllowed(request, e))
    return json({ error: 'Please use your invitation link.' }, 403);
  if (!managementReady(e))
    return json({ error: 'Reservations are not available right now.' }, 503);
  const raw = await request.text();
  if (raw.length > 2000) return json({ error: 'Invalid invitation.' }, 400);
  let body: { token: string; action: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid invitation.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return json({ error: 'Invalid invitation.' }, 400);
  const signed = await readToken(String(body.token || ''), e);
  if (!signed)
    return json(
      {
        error:
          'This invitation has expired or is invalid. You can check the studio for a new place.',
      },
      410,
    );
  try {
    await expire(e.DB).run();
    let booking = await e.DB.prepare('SELECT * FROM bookings WHERE id=?')
      .bind(signed.id)
      .first<Booking>();
    if (!booking)
      return json({ error: 'This reservation is unavailable.' }, 404);
    if (body.action === 'confirm') {
      if (signed.purpose !== 'verify')
        return json(
          { error: 'Please use the confirmation link from your invitation.' },
          400,
        );
      const timestamp = now();
      const result = await e.DB.batch([
        e.DB.prepare(
          "UPDATE bookings SET status='reserved',hold_expires=? WHERE id=? AND status='pending' AND verify_expires>?",
        ).bind(
          timestamp + booking.hold_expires - booking.created_at,
          booking.id,
          timestamp,
        ),
        e.DB.prepare(
          "INSERT INTO email_events(id,booking_id,kind,status,created_at) SELECT ?,id,'confirmed','queued',? FROM bookings WHERE id=? AND status='reserved' ON CONFLICT(id) DO NOTHING",
        ).bind(`confirmed/${booking.id}/v1`, timestamp, booking.id),
        e.DB.prepare('SELECT * FROM bookings WHERE id=?').bind(booking.id),
      ]);
      booking = result[2].results[0] as unknown as Booking;
    } else if (body.action === 'cancel') {
      if (!['verify', 'manage'].includes(signed.purpose))
        return json({ error: 'Invalid invitation.' }, 400);
      await e.DB.prepare(
        "UPDATE bookings SET status='cancelled' WHERE id=? AND status IN ('pending','reserved')",
      )
        .bind(booking.id)
        .run();
      booking = await e.DB.prepare('SELECT * FROM bookings WHERE id=?')
        .bind(booking.id)
        .first<Booking>();
    } else if (!['inspect', 'resend'].includes(body.action))
      return json({ error: 'Invalid action.' }, 400);
    if (!booking)
      return json({ error: 'This reservation is unavailable.' }, 404);
    let emailSent: boolean | null = null;
    if (
      booking.status === 'reserved' &&
      ['confirm', 'resend'].includes(body.action)
    )
      emailSent = await deliverEmail(booking, 'confirmed', e);
    const manageToken =
      booking.status === 'reserved'
        ? await token(booking.id, 'manage', booking.hold_expires, e)
        : null;
    return json({
      artist: booking.artist,
      song: booking.song,
      mood: booking.mood,
      status: booking.status,
      expiresAt: new Date(
        (booking.status === 'pending'
          ? booking.verify_expires
          : booking.hold_expires) * 1000,
      ).toISOString(),
      emailSent,
      manageToken,
      replyTo: e.EMAIL_REPLY_TO,
    });
  } catch {
    return json(
      { error: 'We couldn’t reach your reservation. Please try again.' },
      503,
    );
  }
}
