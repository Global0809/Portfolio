// Local-only preview of the supplied masters. Never copied into the public site.
import { createServer } from 'node:http';
import { createReadStream, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const folder = process.argv[2];
if (!folder) throw new Error('Usage: node scripts/preview-full-videos.mjs <video-folder>');
const files = readdirSync(folder);
const sources = new Map([
  ['i-do-da-biness', /^i do da biness.*\.mp4$/i],
  ['leo-ghetto', /^leo ghetto.*\.mp4$/i],
  ['nice-and-neat', /^nice and neat.*\.mp4$/i],
  ['owo', /^owo.*\.mp4$/i],
].map(([id, pattern]) => {
  const file = files.find((name) => pattern.test(name));
  if (!file) throw new Error(`Missing source for ${id}`);
  return [`/${id}.mp4`, resolve(folder, file)];
}));

createServer((req, res) => {
  const origin = req.headers.origin;
  const localOrigin = origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  if (!['127.0.0.1:4174', 'localhost:4174'].includes(req.headers.host) || (origin && !localOrigin)) {
    res.writeHead(403).end();
    return;
  }
  if (localOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  const file = sources.get(new URL(req.url, 'http://localhost').pathname);
  if (!file) { res.writeHead(404).end(); return; }
  const size = statSync(file).size;
  let start = 0;
  let end = size - 1;
  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (start >= size || end < start) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      return;
    }
  }
  res.writeHead(range ? 206 : 200, {
    'Content-Type': 'video/mp4',
    'Content-Length': end - start + 1,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    ...(range ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
  });
  if (req.method === 'HEAD') { res.end(); return; }
  const stream = createReadStream(file, { start, end });
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}).listen(4174, '127.0.0.1', () => console.log('Four local masters ready at http://127.0.0.1:4174'));
