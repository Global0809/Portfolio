# AICANFEEL — Portfolio

The complete mobile-first CGI / VFX portfolio, with five portrait films, a real-time glass film fan, Shader Lines background, control-linked scan effects, a glass video carousel, soundtrack waveforms and a personalized musician brief.

**Deploy:** follow [DEPLOY.md](DEPLOY.md) to connect this repository to Cloudflare Workers.

**Final checks and limitations:** see [FINAL-CHECK.md](FINAL-CHECK.md).

Repository: [Global0809/Portfolio](https://github.com/Global0809/Portfolio). The short opening reveal, illuminated studio highlights and scroll-linked glitch accents share the existing glass visual language. Sound is enabled by default but starts only after a trusted visitor gesture; a saved mute preference is respected. Interface audio stops during music video playback.

## Run locally

Use Node 22.13 or newer.

```sh
npm ci
npm run dev
```

For a production check: `npm run typecheck`, `npm run test:bookings`, `npm run build`, then `npm start`.

## Main editable files

- `app/page.tsx`: portfolio composition and navigation.
- `app/entrance.tsx`, `app/studio-signatures.tsx`, `app/signal-details.css`: opening transition, capability highlights and glass controls.
- `app/interface-sound.ts`: gesture-armed sound preference and synthesized interaction/scan accents.
- `app/film-player.tsx`: glass viewer, player controls and film switching.
- `app/listening-room.css`: film carousel and artist pass styling.
- `app/booking.tsx`: three required details and a choice of visual direction.
- `app/studio-config.ts`: studio identity, Instagram presentation and email.
- `app/films.ts`: the five films and cover mapping.
- `app/neural-links.tsx`, `components/ui/shader-lines.tsx`, `app/sculpture.tsx`: capped, reduced-motion-aware background and glass effects.
- `public/media`: all five optimized MP4s, WebP covers and waveform envelopes.
- `wrangler.jsonc`, `vite.config.ts`: standalone Cloudflare deployment configuration.

The original source footage remains unchanged. Run `node scripts/prepare-waveforms.mjs` with FFmpeg installed after replacing a soundtrack.

The booking form currently prepares an email request to **aicanfeel@gmail.com**. A slot is confirmed by the studio. Automated reservation emails remain disabled until the real database, sender, secrets and studio-approved hold duration are configured.

This repository contains the complete deployment copy. It has no dependency on a Codex workspace, a Sites project, or the original computer's media paths.
