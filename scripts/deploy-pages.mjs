import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const source = resolve('pages-dist');
if (!existsSync(join(source, 'index.html'))) throw new Error('Run npm run build first');
const remote = 'https://github.com/Global0809/Portfolio.git';
const temp = mkdtempSync(join(tmpdir(), 'aicanfeel-pages-'));
const checkout = join(temp, 'site');
const auth = ['-c', 'credential.https://github.com.helper=!gh auth git-credential', '-c', 'http.version=HTTP/1.1'];
const git = (args, cwd = checkout) => execFileSync('git', [...auth, ...args], { cwd, stdio: 'inherit' });

try {
  const exists = execFileSync('git', [...auth, 'ls-remote', '--heads', remote, 'gh-pages'], { encoding: 'utf8' }).trim();
  if (exists) {
    git(['clone', '--depth', '1', '--branch', 'gh-pages', remote, checkout], temp);
    for (const entry of readdirSync(checkout)) {
      if (entry === '.git') continue;
      const path = resolve(checkout, entry);
      if (!path.startsWith(resolve(checkout) + sep)) throw new Error('Invalid artifact path');
      rmSync(path, { recursive: true, force: true });
    }
  } else {
    git(['init', '--initial-branch=gh-pages', checkout], temp);
    git(['remote', 'add', 'origin', remote]);
  }
  cpSync(source, checkout, { recursive: true });
  git(['add', '--all']);
  const changes = execFileSync('git', ['status', '--porcelain'], { cwd: checkout, encoding: 'utf8' });
  if (changes.trim()) {
    git(['-c', 'user.name=Codex', '-c', 'user.email=codex@openai.com', 'commit', '-m', 'Publish AICANFEEL portfolio']);
    git(['push', 'origin', 'gh-pages']);
  } else console.log('Published artifact is already current.');
  console.log('GitHub Pages: https://global0809.github.io/Portfolio/');
} finally {
  const safe = resolve(temp);
  if (safe.startsWith(resolve(tmpdir()) + sep) && safe.split(sep).at(-1).startsWith('aicanfeel-pages-')) rmSync(safe, { recursive: true, force: true });
}
