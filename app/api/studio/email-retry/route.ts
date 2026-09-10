import {
  Booking,
  deliverEmail,
  environment,
  expire,
  json,
  now,
} from '@/lib/bookings';
export async function POST(request: Request) {
  const e = environment();
  if (
    !e.BOOKING_ADMIN_KEY ||
    request.headers.get('Authorization') !== `Bearer ${e.BOOKING_ADMIN_KEY}`
  )
    return json({ error: 'Unauthorized' }, 401);
  if (!e.DB)
    return json({ error: 'The studio database is not configured.' }, 503);
  try {
    await expire(e.DB).run();
    const rows = await e.DB.prepare(
      "SELECT b.*,v.kind FROM email_events v JOIN bookings b ON b.id=v.booking_id WHERE v.status!='sent' AND v.created_at>? AND ((v.kind='verify' AND b.status='pending') OR (v.kind='confirmed' AND b.status='reserved')) ORDER BY v.created_at LIMIT 5",
    )
      .bind(now() - 23 * 3600)
      .all<Booking & { kind: 'verify' | 'confirmed' }>();
    const results = [];
    for (const row of rows.results)
      results.push({ id: row.id, sent: await deliverEmail(row, row.kind, e) });
    return json({ results });
  } catch {
    return json({ error: 'Email recovery is temporarily unavailable.' }, 503);
  }
}
