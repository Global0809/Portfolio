// Create web copies; the source masters are never modified.
import { spawn } from 'node:child_process';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const folder = process.argv[2];
if (!folder) throw new Error('Usage: node scripts/encode-full-videos.mjs <original-video-folder>');
const encoder = process.env.AICANFEEL_VIDEO_ENCODER || 'libx264';
const ffmpeg = process.env.AICANFEEL_FFMPEG || 'ffmpeg';
if (!['h264_nvenc', 'libx264'].includes(encoder)) throw new Error('Unsupported encoder');
const targets = [
  { id: 'i-do-da-biness', pattern: /^i do da biness.*\.mp4$/i },
  { id: 'leo-ghetto', pattern: /^leo ghetto.*\.mp4$/i },
  { id: 'nice-and-neat', pattern: /^nice and neat.*\.mp4$/i },
  { id: 'owo', pattern: /^owo.*\.mp4$/i },
];
const selectedIds = process.argv[3]?.split(',');
if (selectedIds?.some(id => !targets.some(target => target.id === id))) throw new Error('Unknown video selection');
const names = await readdir(folder);
const destination = resolve('public/media/full-music-videos');
await mkdir(destination, { recursive: true });
const manifest = [];
const codec = (cq, rate) => encoder === 'h264_nvenc'
  ? ['-c:v', encoder, '-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-cq', String(cq), '-b:v', '0', '-maxrate', `${rate}k`, '-bufsize', `${rate * 2}k`]
  : ['-c:v', encoder, '-preset', 'fast', '-crf', String(cq - 2), '-maxrate', `${rate}k`, '-bufsize', `${rate * 2}k`, '-threads', '6'];
const common = ['-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '60', '-c:a', 'copy', '-map_metadata', '-1', '-movflags', '+faststart'];
for (const target of targets) {
  if (selectedIds && !selectedIds.includes(target.id)) continue;
  const matches = names.filter(name => target.pattern.test(name));
  if (matches.length !== 1) throw new Error(`Expected one source for ${target.id}`);
  const source = resolve(folder, matches[0]);
  const hd = resolve(destination, `${target.id}-1080.mp4`);
  const mobile = resolve(destination, `${target.id}-720.mp4`);
  if ([hd, mobile].includes(source)) throw new Error('Source must be outside web output files');
  console.log(`Encoding ${target.id} (1080p + 720p)…`);
  const args = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', source,
    '-filter_complex', '[0:v:0]fps=30,split=2[hd][sd];[hd]scale=1920:1080:flags=lanczos[vhd];[sd]scale=1280:720:flags=lanczos[vsd]',
    '-map', '[vhd]', '-map', '0:a:0', ...codec(23, 3200), ...common, hd,
    '-map', '[vsd]', '-map', '0:a:0', ...codec(24, 1500), ...common, mobile,
  ];
  await new Promise((done, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'inherit'], windowsHide: true });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? done() : reject(new Error(`ffmpeg exited ${code}`)));
  });
  const hdBytes = (await stat(hd)).size;
  const mobileBytes = (await stat(mobile)).size;
  if (Math.max(hdBytes, mobileBytes) >= 95 * 1024 * 1024) throw new Error(`${target.id} exceeds the web-copy size budget`);
  manifest.push({ id: target.id, hdBytes, mobileBytes, sourceBytes: (await stat(source)).size, encoder });
  console.log(`${target.id}: ${Math.round(hdBytes / 1024 / 1024)} MiB HD / ${Math.round(mobileBytes / 1024 / 1024)} MiB mobile`);
}
await mkdir('outputs/full-music-videos', { recursive: true });
await writeFile('outputs/full-music-videos/web-copies.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('Selected originals have two web copies. Original AAC audio copied unchanged.');
