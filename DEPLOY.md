# Deploy AICANFEEL from GitHub

This is a complete **Cloudflare Workers** project, including all five optimized videos. It uses React, TypeScript, Tailwind and Vinext. GitHub stores the source; Cloudflare serves the public website. GitHub Pages is not the deployment target because this project includes server routes.

## Connect the repository

In Cloudflare, create a Worker connected to this GitHub repository and use:

| Setting | Value |
| --- | --- |
| Worker name | `aicanfeel-light-archive` |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Node version | `22.16.0` or newer Node 22 |

Cloudflare installs dependencies from `package-lock.json`. If you enter a custom install command, use `npm ci`. The build generates `dist/server/wrangler.json`; the deploy command publishes that generated Worker and its static media. Your Cloudflare dashboard supplies the resulting public `workers.dev` URL. You can connect a custom domain afterward.

This configuration deploys the portfolio and email-request flow without a database or email-provider account. `BOOKING_ENABLED` remains `false`.

Official setup references: [Workers GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/), [build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

## Deploy from a terminal

Use Node 22.13 or newer, then:

```sh
npm ci
npm run typecheck
npm run test:bookings
npm run build
npx wrangler login
npm run deploy
```

`wrangler login` connects your own Cloudflare account. No hosting credentials are stored in this repository. For a local production preview, run `npm start` after building.

## Automatic reservations later

The current form prepares a personalized email request to `aicanfeel@gmail.com`; the visitor reviews and sends it. It does not automatically allocate a slot or send a confirmation email.

To enable automated reservations:

1. Create your own Cloudflare D1 database. Add its real ID to a `d1_databases` entry in `wrangler.jsonc` with binding `DB` and `migrations_dir: "drizzle"`.
2. Apply the included migration with `npx wrangler d1 migrations apply DB --remote`.
3. Configure the private runtime values listed in `.env.example`, including an authenticated sender, signing/admin keys, your public origin and the studio-approved hold duration. Use Cloudflare secrets for secret values.
4. Test email delivery and the complete confirmation/expiry flow before changing `BOOKING_ENABLED` to `true` in the configuration.

Do not reuse placeholder database IDs or invent a remaining-slot count. Studio management requires the admin key even when the portfolio is public.

## Source and media

The GitHub delivery includes all five MP4s, five optimized WebP covers made from the supplied thumbnails, and compact waveform data. No files need to be recovered from the original Windows computer.

The largest MP4 is approximately 23.6 MB. Keep future assets within the chosen host's individual asset limit; use appropriate media hosting if replacing them with larger files. The original source footage has not been modified.

The portfolio UI is the validated AICANFEEL glass-carousel version. This export only changes hosting configuration and includes the previously ignored video files. See `FINAL-CHECK.md` for checks and known limitations.
