# Full music videos

The collection sits immediately above the Instagram contact section. It extends the existing dark glass materials, Manrope/Cormorant typography, and neural tracking, using widescreen footage covers rather than changing the hero.

## Media

Original files remain outside the repository. All four are 3840 × 2160 with AAC stereo audio. These are the display names and durations:

| Title | Runtime | Poster timestamp |
| --- | --- | --- |
| I Do Da Biness | 2:03 | 12.281 s |
| Leo Ghetto | 3:04 | 92.021 s |
| Nice and Neat | 3:33 | 195.828 s |
| OWO | 3:05 | 144.512 s |

The first and last titles were confirmed in opening title cards. Other titles come from the supplied filenames. Posters in `public/media/full-music-videos/` are actual source frames, cropped to remove letterboxing and fit 16:9, exported to 1280 × 720 WebP. Playback retains the full source composition.

## Free streaming setup

Use a Mux **Free** account, not temporary test assets or a paid plan. Upload the four supplied music videos, with public playback and a maximum streaming resolution of 1080p. Keep the required Mux branding visible. No API credential belongs in a client-side file or the repository.

Once the assets have finished processing, set their public playback IDs in `app/full-music-video-catalog.ts`. These IDs are designed to be public; API tokens are not. The embedded player loads only after the visitor selects a video. Closing or switching the viewer unmounts the previous player.

The collection stays hidden on the public site until videos are configured. Do not publish this addition as complete until all four IDs are set and each stream has been checked.

## Local preview before uploads

In one terminal, serve the originals from their existing folder:

```powershell
node scripts/preview-full-videos.mjs 'C:\path\to\video-folder'
```

In another, start the site with Node 22:

```powershell
npx --yes --package=node@22 -- npm run dev -- --host 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/#full-music-videos`. Unconfigured videos are available only on localhost through a clearly labeled local preview. The separate media server binds to 127.0.0.1, supports byte ranges for seeking, and exposes only the four named files. It is not part of the deployment.

The media server rejects unexpected Host headers and nonlocal Origin values. If the development server prints `http://localhost:3000`, use that URL instead of 127.0.0.1.

## Validation scope

Check gallery placement and mobile layout, all four sources, open/close/switch behavior, keyboard navigation and focus return, seeking/sound/fullscreen, reduced motion, loading/error recovery, and no full-video requests before a selection. A local MP4 check does not substitute for validating the final Mux streams.

Local verification on September 26, 2026: TypeScript, targeted lint, static build and mechanical UI checks pass. Browser checks passed for all four local files, autoplay after selection, pause, seeking to one minute, mute, source removal on close, focus return, and one player while switching. There were zero original-video requests before a selection. Layout checked at 1440, 390 and 320 px; mobile widths had no horizontal overflow. Forced network failure, retry, end/replay, keyboard Enter/Escape, and reduced-motion checks passed. Final Mux playback and native fullscreen still require verification after the account is connected.
