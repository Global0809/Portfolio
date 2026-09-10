import { availability, environment, json } from '@/lib/bookings';
export async function GET() {
  try {
    return json(await availability(environment()));
  } catch {
    return json(
      { enabled: false, remaining: null, capacity: 7, holdHours: null },
      503,
    );
  }
}
