import { environment, expire, json, now } from '@/lib/bookings';
export async function GET(request: Request) {
  const e = environment();
  if (
    !e.BOOKING_ADMIN_KEY ||
    request.headers.get('Authorization') !== `Bearer ${e.BOOKING_ADMIN_KEY}`
  )
    return json({ error: 'Unauthorized' }, 401);
  try {
    await expire(e.DB).run();
    const rows = await e.DB.prepare(
      'SELECT id,artist,email,song,mood,link,vision,inspiration,status,slot,hold_expires,created_at FROM bookings ORDER BY created_at DESC LIMIT 100',
    ).all();
    return json({ reservations: rows.results });
  } catch {
    return json({ error: 'The studio database is not available.' }, 503);
  }
}
export async function POST(request: Request) {
  const e = environment();
  if (
    !e.BOOKING_ADMIN_KEY ||
    request.headers.get('Authorization') !== `Bearer ${e.BOOKING_ADMIN_KEY}`
  )
    return json({ error: 'Unauthorized' }, 401);
  let body: { id: string; action: string };
  try {
    const raw = await request.text();
    if (raw.length > 2000) return json({ error: 'Invalid request' }, 400);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    typeof body.id !== 'string' ||
    !['start', 'complete', 'cancel'].includes(body.action)
  )
    return json({ error: 'Invalid action' }, 400);
  try {
    await expire(e.DB).run();
    const status =
      body.action === 'start'
        ? 'started'
        : body.action === 'complete'
          ? 'completed'
          : 'cancelled';
    const previous =
      body.action === 'start'
        ? 'reserved'
        : body.action === 'complete'
          ? 'started'
          : 'reserved';
    const result = await e.DB.prepare(
      "UPDATE bookings SET status=? WHERE id=? AND status=? AND (status!='reserved' OR hold_expires>?)",
    )
      .bind(status, body.id, previous, now())
      .run();
    return result.meta.changes
      ? json({ ok: true, status })
      : json(
          {
            error:
              'Reservation is not in the required state, or the hold expired.',
          },
          409,
        );
  } catch {
    return json({ error: 'The studio database is not available.' }, 503);
  }
}
