# GitHub Pages

Live website: **https://global0809.github.io/Portfolio/**

The editable source lives on `main`. GitHub Pages publishes the generated static website from the root of `gh-pages`. No API keys, database, paid hosting, or server are needed.

## Publish an update

Install Node 22 LTS and GitHub CLI, and authenticate GitHub CLI with an account that can push to this repository. Then:

```sh
npm ci
npm run typecheck
npm run deploy
```

The deploy command builds the website, prepares `pages-dist`, and pushes the generated files to `gh-pages`. GitHub publishes that branch automatically. Commit and push editable source changes to `main` separately.

Repository Settings → Pages should use **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**.

## Project path

The website is hosted beneath `/Portfolio/`. `next.config.ts` and `app/site-path.ts` provide that prefix. The packaging script normalizes Vinext's prefixed asset directories for GitHub Pages and includes `.nojekyll`. If you change the repository name, update these paths, the canonical URL in `app/layout.tsx`, and `scripts/deploy-pages.mjs` before rebuilding.

All five optimized MP4s, covers and waveform files are included. Original footage remains untouched. Videos load on selection.

This GitHub Pages deployment is separate from the earlier chatgpt.site preview.
