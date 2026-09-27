# AICANFEEL — Portfolio

**Live website: [aicanfeelweb.com](https://aicanfeelweb.com/)**

A mobile-first CGI / VFX music video portfolio. Five portrait videos, four full music videos with mobile and HD playback, a real-time glass cover fan, shader background, control-linked scan effects, and a studio reservation section with WebGL optics and an Instagram conversation link.

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
- `app/reservation-config.ts`: genuine studio availability, when confirmed.
- `app/studio-config.ts`: Instagram profile, message link, and supplied profile details.
- `app/film-player.tsx`, `app/listening-room.css`: music video viewer and playback controls.
- `app/films.ts`, `public/media`: video metadata, optimized media, covers, and audio envelopes.
- `app/full-music-videos.tsx`, `app/full-music-videos.css`, `app/full-music-video-catalog.ts`: full-length collection and screening room above the reservation section; see [FULL-MUSIC-VIDEOS.md](FULL-MUSIC-VIDEOS.md) for the included 720p/1080p web copies and hosting limits.
- `app/interface-sound.ts`: gesture-armed interaction sounds and mute preference.
- `app/neural-links.tsx`, `components/ui/shader-lines.tsx`, `app/sculpture.tsx`: reactive visual effects.
- `components/ui/neural-face.tsx`, `app/studio-signatures.tsx`: the face-scan interlude. The renderer samples a local canonical mesh, caps mobile cost, and pauses offscreen or during playback. Geometry provenance and the matching still are documented in `docs/NEURAL-FACE-ASSET.md`.
- `app/studio-signatures.tsx`, `app/studio-signatures.css`: studio highlights; `app/signal-details.css`: entrance and glass-arrow styling.

This version is fully static. “Reserve slot” opens [@aicanfeel on Instagram](https://ig.me/m/aicanfeel), where the studio confirms availability and plans the music video. Pricing is hidden for now. The site does not collect payments or automatically confirm reservations. See [RESERVATIONS.md](RESERVATIONS.md) for the contact flow. Email contact: aicanfeel@gmail.com.

Sound is enabled by default but starts only after a trusted visitor gesture. Saved mute preferences and reduced-motion settings are respected. Original video audio is preserved; interface sounds stop during playback.

See [DEPLOY.md](DEPLOY.md) for publishing and [FINAL-CHECK.md](FINAL-CHECK.md) for validation details.
