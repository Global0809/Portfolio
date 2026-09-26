import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { copyArtifact } from './copy-artifact.mjs';

const root = process.cwd();
const source = resolve(root, 'dist/client');
const target = resolve(root, 'pages-dist');
if (!target.startsWith(resolve(root) + sep) || target === source) throw new Error('Invalid output directory');
if (!existsSync(resolve(source, 'index.html'))) throw new Error('Static export is missing index.html');
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
copyArtifact(source, target);

writeFileSync(resolve(target, '.nojekyll'), '');
const html = readFileSync(resolve(target, 'index.html'), 'utf8');
if (!html.includes('/_next/') || html.includes('/Portfolio/')) throw new Error('Expected custom-domain root asset paths');
if (readFileSync(resolve(target, 'CNAME'), 'utf8').trim() !== 'aicanfeelweb.com') throw new Error('Missing custom-domain CNAME');
for (let i = 1; i <= 5; i++) {
  for (const name of [`film-${i}.mp4`, `cover-${i}.webp`, `wave-${i}.json`]) {
    if (!existsSync(resolve(target, 'media', name))) throw new Error(`Missing ${name}`);
  }
}
for (const id of ['i-do-da-biness', 'leo-ghetto', 'nice-and-neat', 'owo']) {
  for (const quality of ['720', '1080']) {
    const path = resolve(target, 'media/full-music-videos', `${id}-${quality}.mp4`);
    if (!existsSync(path)) throw new Error(`Missing full music video: ${id} ${quality}p`);
    const size = statSync(path).size;
    if (size < 1024 || size >= 95 * 1024 * 1024) throw new Error(`Invalid web-copy size: ${id} ${quality}p`);
  }
}
console.log('GitHub Pages artifact ready: pages-dist/');
