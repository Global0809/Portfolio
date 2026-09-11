# AICANFEEL — Portfolio

**Live website: [global0809.github.io/Portfolio](https://global0809.github.io/Portfolio/)**

A mobile-first CGI / VFX music video portfolio. Five portrait videos, a real-time glass cover fan, shader background, control-linked scan effects, soundtrack waves, and a single Instagram message invitation.

## Local development

Use Node 22 LTS (22.13 or newer within the 22.x line), then:

```sh
npm ci
npm run dev
```

Open the URL printed by the development server. The production preview uses `/Portfolio/`.

For the production version:

```sh
npm run typecheck
npm run build
npm start
```

Open [localhost:4173/Portfolio/](http://localhost:4173/Portfolio/).

Windows with Node 24 can hit an upstream build-shutdown error. Use Node 22, or run `npx --yes --package=node@22 -- npm run build` to build with Node 22 temporarily.

## Editable source

- `app/page.tsx`: composition, navigation, and portfolio.
- `app/instagram-invitation.tsx`, `app/instagram-invitation.css`: Instagram contact section.
- `app/studio-config.ts`: Instagram profile, message link, and supplied profile details.
- `app/film-player.tsx`, `app/listening-room.css`: music video viewer and playback controls.
- `app/films.ts`, `public/media`: video metadata, optimized media, covers, and audio envelopes.
- `app/interface-sound.ts`: gesture-armed interaction sounds and mute preference.
- `app/neural-links.tsx`, `components/ui/shader-lines.tsx`, `app/sculpture.tsx`: reactive visual effects.
- `app/studio-signatures.tsx`, `app/signal-details.css`: studio highlights and entrance styling.

This version is fully static. It contains no booking form, reservation API, database, email sender, or slot counters. The contact button opens Instagram messaging; the profile link is also available. Instagram may require sign-in.

Sound is enabled by default but starts only after a trusted visitor gesture. Saved mute preferences and reduced-motion settings are respected. Original video audio is preserved; interface sounds stop during playback.

See [DEPLOY.md](DEPLOY.md) for publishing and [FINAL-CHECK.md](FINAL-CHECK.md) for validation details.
