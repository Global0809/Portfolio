import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const films = JSON.parse(readFileSync(new URL('../app/portrait-media.json', import.meta.url), 'utf8'));
const target = join(process.cwd(), 'public', 'media');
mkdirSync(target, { recursive: true });
for (const { src: name } of films) {
  const path = join(target, name);
  if (existsSync(path)) continue;
  const supplied = process.env.AICANFEEL_MEDIA_DIR && join(process.env.AICANFEEL_MEDIA_DIR, name);
  if (supplied && existsSync(supplied)) copyFileSync(supplied, path);
  else throw new Error(`Missing ${name}. Use the complete source ZIP (which includes public/media), or set AICANFEEL_MEDIA_DIR to the optimized film directory.`);
}
console.log('All five films are ready.');
