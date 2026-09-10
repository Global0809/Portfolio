// Generate compact, non-audio amplitude envelopes from the unmodified web films.
// Run manually after replacing media. No browser decoding or audio rerouting needed.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

for (let id = 1; id <= 5; id++) {
  const source = fileURLToPath(
    new URL(`../public/media/film-${id}.mp4`, import.meta.url),
  );
  const result = spawnSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      source,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '8000',
      '-f',
      'f32le',
      'pipe:1',
    ],
    { maxBuffer: 8_000_000 },
  );
  if (result.status !== 0)
    throw new Error(result.stderr?.toString() || 'FFmpeg unavailable');
  const pcm = result.stdout;
  const envelope = [];
  for (let byte = 0; byte < pcm.length; byte += 1280) {
    let sum = 0,
      count = 0;
    for (
      let offset = byte;
      offset + 4 <= Math.min(byte + 1280, pcm.length);
      offset += 4
    ) {
      sum += pcm.readFloatLE(offset) ** 2;
      count++;
    }
    envelope.push(Math.sqrt(sum / Math.max(1, count)));
  }
  const peak = Math.max(...envelope, 0.001);
  const data = {
    fps: 25,
    samples: envelope.map((value) => Math.round(Math.sqrt(value / peak) * 255)),
  };
  const target = new URL(`../public/media/wave-${id}.json`, import.meta.url);
  writeFileSync(target, JSON.stringify(data));
  console.log(
    `Film ${id}: ${data.samples.length} amplitude samples, ${readFileSync(target).length} bytes`,
  );
}
