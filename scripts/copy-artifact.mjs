import { copyFileSync, linkSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Generated artifacts stay immutable during publishing. Reuse their bytes on
// the same volume instead of duplicating hundreds of megabytes of video.
export function copyArtifact(source, target) {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory()) copyArtifact(from, to);
    else if (entry.isFile()) {
      try { linkSync(from, to); }
      catch (error) {
        if (!['EXDEV', 'EPERM', 'ENOTSUP', 'EACCES'].includes(error.code)) throw error;
        copyFileSync(from, to);
      }
    } else throw new Error(`Unsupported artifact entry: ${entry.name}`);
  }
}
