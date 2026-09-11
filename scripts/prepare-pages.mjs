import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const root = process.cwd();
const source = resolve(root, 'dist/client');
const target = resolve(root, 'pages-dist');
if (!target.startsWith(resolve(root) + sep) || target === source) throw new Error('Invalid output directory');
if (!existsSync(resolve(source, 'index.html'))) throw new Error('Static export is missing index.html');
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

// Vinext writes prefixed assets on disk. Pages supplies /Portfolio at the mount point.
const prefixed = resolve(target, 'Portfolio');
if (existsSync(resolve(prefixed, '_next'))) {
  cpSync(resolve(prefixed, '_next'), resolve(target, '_next'), { recursive: true });
  if (!prefixed.startsWith(target + sep)) throw new Error('Invalid nested output');
  rmSync(prefixed, { recursive: true, force: true });
}
writeFileSync(resolve(target, '.nojekyll'), '');
const html = readFileSync(resolve(target, 'index.html'), 'utf8');
if (!html.includes('/Portfolio/_next/')) throw new Error('Expected project-prefixed assets');
for (let i = 1; i <= 5; i++) {
  for (const name of [`film-${i}.mp4`, `cover-${i}.webp`, `wave-${i}.json`]) {
    if (!existsSync(resolve(target, 'media', name))) throw new Error(`Missing ${name}`);
  }
}
console.log('GitHub Pages artifact ready: pages-dist/');
