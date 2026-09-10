import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(
  process.argv[2] || fileURLToPath(new URL('../', import.meta.url)),
);
const require = createRequire(path.join(project, 'package.json'));
const { build } = require('esbuild');
const { Miniflare, Log, LogLevel } = require('miniflare');
const origin = 'https://studio.test';
const source = `import { POST as create } from './app/api/reservations/route.ts';
import { POST as manage } from './app/api/reservation/route.ts';
import { GET as available } from './app/api/availability/route.ts';
import { POST as admin } from './app/api/studio/reservations/route.ts';
export default { fetch(request) { const p = new URL(request.url).pathname;
return p === '/api/reservations' ? create(request) : p === '/api/reservation' ? manage(request) : p === '/api/availability' ? available() : admin(request); } };`;
console.log('Bundling actual route handlers, without changing the checkout.');
const bundle = await build({
  stdin: {
    contents: source,
    resolveDir: project,
    sourcefile: 'integration-entry.ts',
  },
  absWorkingDir: project,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['cloudflare:workers'],
  write: false,
});
const mailCalls = [],
  delivered = new Map();
let rejectMail = false,
  mf,
  db,
  failures = 0;
const bindings = {
  BOOKING_ENABLED: 'true',
  BOOKING_HOLD_HOURS: '48',
  BOOKING_SIGNING_SECRET: 'integration-test-secret-not-for-production',
  RESEND_API_KEY: 'fake-never-sent',
  EMAIL_FROM: 'Studio <test@example.invalid>',
  EMAIL_REPLY_TO: 'test@example.invalid',
  SITE_ORIGIN: origin,
  BOOKING_ADMIN_KEY: 'integration-admin',
};
const options = {
  modules: true,
  script: bundle.outputFiles[0].text,
  compatibilityDate: '2026-05-15',
  d1Databases: ['DB'],
  bindings,
  log: new Log(LogLevel.WARN),
  outboundService: async (request) => {
    assert.equal(
      request.url,
      'https://api.resend.com/emails',
      'All other external traffic is forbidden',
    );
    const payload = await request.json(),
      key = request.headers.get('Idempotency-Key');
    mailCalls.push({ key, payload, rejected: rejectMail });
    if (rejectMail)
      return Response.json(
        { message: 'Simulated provider outage' },
        { status: 503 },
      );
    const previous = delivered.get(key);
    if (previous) {
      if (JSON.stringify(previous.payload) !== JSON.stringify(payload))
        return Response.json(
          { message: 'Different idempotent payload' },
          { status: 409 },
        );
      return Response.json({ id: previous.id });
    }
    const id = `fake-message-${delivered.size + 1}`;
    delivered.set(key, { payload, id });
    return Response.json({ id });
  },
};
const watchdog = setTimeout(() => {
  console.error('FAIL: integration runtime exceeded 120 seconds');
  process.exit(2);
}, 120000);
async function check(name, operation) {
  try {
    await operation();
    console.log(`PASS: ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL: ${name}: ${error.stack || error}`);
  }
}
const headers = { Origin: origin, 'Content-Type': 'application/json' };
const bodyFor = (i) => ({
  artist: `Artist ${i}`,
  email: `artist${i}@example.invalid`,
  song: `Track ${i}`,
  mood: 'Cinematic',
});
async function call(route, body, extra = {}) {
  const response = await mf.dispatchFetch(origin + route, {
    method: 'POST',
    headers: { ...headers, ...extra },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, data };
}
const keyFor = (i) => `integration-request-${String(i).padStart(10, '0')}`;
const create = (i, changes = {}) =>
  call(
    '/api/reservations',
    { ...bodyFor(i), ...changes },
    { 'Idempotency-Key': keyFor(i), 'CF-Connecting-IP': `198.51.100.${i}` },
  );
const manage = (token, action) => call('/api/reservation', { token, action });
function tokenFor(i, kind = 'verify') {
  const message = [...delivered.values()]
    .map((v) => v.payload)
    .find(
      (v) =>
        v.to.includes(bodyFor(i).email) &&
        (kind === 'verify'
          ? v.text.includes('Confirm your email:')
          : v.text.includes('View or cancel your reservation:')),
    );
  assert.ok(message, `Expected ${kind} message for ${i}`);
  return decodeURIComponent(message.text.match(/#token=([^\s]+)/)[1]);
}
async function reset() {
  await db.prepare('DELETE FROM email_events').run();
  await db.prepare('DELETE FROM bookings').run();
  mailCalls.length = 0;
  delivered.clear();
  rejectMail = false;
}
try {
  console.log(
    'Starting an isolated Miniflare Worker and D1 database; outbound mail is intercepted.',
  );
  mf = new Miniflare(options);
  await mf.ready;
  console.log(
    'Worker ready. Applying the checked-in migration to isolated local D1.',
  );
  db = await mf.getD1Database('DB');
  const migration = await readFile(
    path.join(project, 'drizzle/0000_lying_timeslip.sql'),
    'utf8',
  );
  for (const statement of migration.split('--> statement-breakpoint'))
    if (statement.trim()) await db.exec(statement.replaceAll('\n', ' '));

  await check(
    'Seven concurrent distinct requests succeed; the eighth cannot allocate',
    async () => {
      const results = await Promise.all(
        Array.from({ length: 7 }, (_, i) => create(i + 1)),
      );
      assert.deepEqual(
        results.map((r) => r.status),
        [201, 201, 201, 201, 201, 201, 201],
        JSON.stringify(results),
      );
      assert.equal((await create(8)).status, 409);
      assert.deepEqual(
        await db
          .prepare(
            'SELECT count(*) AS total, count(distinct slot) AS slots FROM bookings',
          )
          .first(),
        { total: 7, slots: 7 },
      );
      assert.equal(delivered.size, 7);
    },
  );
  await check(
    'Idempotent retry keeps one booking and one delivered email',
    async () => {
      assert.equal((await create(1)).status, 201);
      assert.equal(
        (await db.prepare('SELECT count(*) AS total FROM bookings').first())
          .total,
        7,
      );
      assert.equal(delivered.size, 7);
      assert.equal((await create(1, { song: 'Changed track' })).status, 409);
    },
  );
  await check(
    'Confirmation is idempotent; cancellation releases exactly one place',
    async () => {
      const token = tokenFor(1),
        confirmed = await manage(token, 'confirm');
      assert.equal(confirmed.status, 200);
      assert.equal(confirmed.data.status, 'reserved');
      const deadline = confirmed.data.expiresAt,
        count = delivered.size;
      const repeated = await manage(token, 'confirm');
      assert.equal(repeated.data.expiresAt, deadline);
      assert.equal(delivered.size, count);
      const cancelled = await manage(confirmed.data.manageToken, 'cancel');
      assert.equal(cancelled.data.status, 'cancelled');
      assert.equal((await create(8)).status, 201);
      assert.equal((await manage(token, 'confirm')).data.status, 'cancelled');
      assert.equal(
        (
          await db
            .prepare(
              "SELECT count(*) AS total FROM bookings WHERE status IN ('pending','reserved','started','completed')",
            )
            .first()
        ).total,
        7,
      );
    },
  );
  await check(
    'JSON null and arrays receive a client error on every mutation route',
    async () => {
      for (const route of [
        '/api/reservations',
        '/api/reservation',
        '/api/studio/reservations',
      ])
        for (const body of ['null', '[]']) {
          const result = await call(route, body, {
            'Idempotency-Key': keyFor(90),
            Authorization: 'Bearer integration-admin',
          });
          assert.ok(
            result.status >= 400 && result.status < 500,
            `${route} ${body}: ${result.status}`,
          );
        }
    },
  );
  await check(
    'Expired verification and reservation holds release capacity without revival',
    async () => {
      await db
        .prepare(
          'UPDATE bookings SET verify_expires=unixepoch()-1 WHERE request_key=?',
        )
        .bind(keyFor(2))
        .run();
      const expired = await manage(tokenFor(2), 'confirm');
      assert.ok(
        expired.status === 410 || expired.data.status === 'expired',
        JSON.stringify(expired),
      );
      assert.equal((await create(9)).status, 201);
      const confirmed = await manage(tokenFor(3), 'confirm');
      assert.equal(confirmed.data.status, 'reserved');
      await db
        .prepare(
          'UPDATE bookings SET hold_expires=unixepoch()-1 WHERE request_key=?',
        )
        .bind(keyFor(3))
        .run();
      assert.equal((await create(10)).status, 201);
      assert.equal(
        (
          await db
            .prepare('SELECT status FROM bookings WHERE request_key=?')
            .bind(keyFor(3))
            .first()
        ).status,
        'expired',
      );
    },
  );
  await reset();
  await check(
    'Provider failure and retry preserve the allocated booking and deduplicate mail',
    async () => {
      rejectMail = true;
      const failed = await create(20);
      assert.equal(failed.status, 502, JSON.stringify(failed));
      assert.equal(
        (await db.prepare('SELECT count(*) AS total FROM bookings').first())
          .total,
        1,
      );
      rejectMail = false;
      assert.equal((await create(20)).status, 201);
      assert.equal(
        (await db.prepare('SELECT count(*) AS total FROM bookings').first())
          .total,
        1,
      );
      assert.equal(delivered.size, 1);
      assert.equal((await create(20)).status, 201);
      assert.equal(delivered.size, 1);
    },
  );
  await check(
    'Parallel reuse of an idempotency key with different briefs rejects one request',
    async () => {
      const results = await Promise.all([
        create(30, { song: 'First brief' }),
        create(30, { song: 'Second brief' }),
      ]);
      assert.deepEqual(
        results.map((r) => r.status).sort(),
        [201, 409],
        JSON.stringify(results),
      );
      assert.equal(
        (
          await db
            .prepare(
              'SELECT count(*) AS total FROM bookings WHERE request_key=?',
            )
            .bind(keyFor(30))
            .first()
        ).total,
        1,
      );
    },
  );
  await check(
    'Pausing new intake preserves management and cancellation of existing bookings',
    async () => {
      const invitation = tokenFor(20);
      await mf.setOptions({
        ...options,
        bindings: { ...bindings, BOOKING_ENABLED: 'false' },
      });
      assert.equal((await create(21)).status, 503);
      const inspected = await manage(invitation, 'inspect');
      assert.equal(inspected.status, 200, JSON.stringify(inspected));
      const cancelled = await manage(invitation, 'cancel');
      assert.equal(cancelled.status, 200);
      assert.equal(cancelled.data.status, 'cancelled');
    },
  );
} finally {
  clearTimeout(watchdog);
  if (mf) await mf.dispose();
}
console.log(
  `Integration review finished: ${failures} failed assertions. No external email was sent.`,
);
process.exitCode = failures ? 1 : 0;
