# AICANFEEL — Portfolio

**Live website: [aicanfeelweb.com](https://aicanfeelweb.com/)**

A mobile-first CGI / VFX music video portfolio. Five portrait videos, four full music videos with mobile and HD playback, a real-time glass cover fan, shader background, control-linked scan effects, and a $99 studio reservation section with WebGL optics.

## Local development

Use Node 22 LTS (22.13 or newer within the 22.x line), then:

```sh
npm ci
npm run dev
```

Open the URL printed by the development server. The production preview uses `/`.

For the production version:

```sh
npm run typecheck
npm run build
npm start
```

Open [localhost:4173](http://localhost:4173/).

Windows with Node 24 can hit an upstream build-shutdown error. Use Node 22, or run `npx --yes --package=node@22 -- npm run build` to build with Node 22 temporarily.

## Editable source

- `app/page.tsx`: composition, navigation, and portfolio.
- `app/studio-reservation.tsx`, `app/studio-reservation.css`, `components/ui/reservation-optics.tsx`: reservation composition and WebGL pass.
- `app/reservation-config.ts`: reservation amount, genuine availability, and hosted payment URL (not yet supplied).
- `app/studio-config.ts`: Instagram profile, message link, and supplied profile details.
- `app/film-player.tsx`, `app/listening-room.css`: music video viewer and playback controls.
- `app/films.ts`, `public/media`: video metadata, optimized media, covers, and audio envelopes.
- `app/full-music-videos.tsx`, `app/full-music-videos.css`, `app/full-music-video-catalog.ts`: full-length collection and screening room above the reservation section; see [FULL-MUSIC-VIDEOS.md](FULL-MUSIC-VIDEOS.md) for the included 720p/1080p web copies and hosting limits.
- `app/interface-sound.ts`: gesture-armed interaction sounds and mute preference.
- `app/neural-links.tsx`, `components/ui/shader-lines.tsx`, `app/sculpture.tsx`: reactive visual effects.
- `app/studio-signatures.tsx`, `app/studio-signatures.css`: studio highlights; `app/signal-details.css`: entrance and glass-arrow styling.

This version is fully static. The reservation is $99, credited in full to the project deposit. Checkout stays visibly unavailable until the studio supplies an HTTPS payment link. There is no fake countdown, simulated purchase, email sender, or automatic reservation confirmation. See [RESERVATIONS.md](RESERVATIONS.md) before enabling checkout. Email contact: aicanfeel@gmail.com.

Sound is enabled by default but starts only after a trusted visitor gesture. Saved mute preferences and reduced-motion settings are respected. Original video audio is preserved; interface sounds stop during playback.

See [DEPLOY.md](DEPLOY.md) for publishing and [FINAL-CHECK.md](FINAL-CHECK.md) for validation details.
