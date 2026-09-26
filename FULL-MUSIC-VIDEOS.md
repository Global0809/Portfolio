# Full music videos

The four-video collection sits immediately above the Instagram contact section. It uses the site's existing typography, glass materials, and actual footage posters.

## Hosting and playback

Videos are served directly from the existing GitHub Pages deployment at `aicanfeelweb.com`. No streaming account, API key, iframe, or external player is needed. Each video has a 720p mobile copy and a 1080p copy; the visitor can change quality without restarting the video. Playback uses native browser controls, including sound, seeking and fullscreen where supported.

Only the selected video is mounted. Closing or switching stops and removes its media source. Website effects pause while the player is open. The gallery itself loads small WebP posters rather than video files.

This is progressive MP4 delivery, not adaptive streaming. It is suitable for a modest portfolio audience. GitHub Pages has a 1 GB published-site limit and a 100 GB/month soft bandwidth limit; individual Git files must be below 100 MiB. The build requires all eight web copies and enforces a stricter 95 MiB file budget. See [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) and [file limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).

## Media

Original 3840 × 2160 files remain outside the repository, unchanged. Web copies use H.264/yuv420p at 30 fps, retain the full source composition, and copy the original AAC audio without re-encoding. The MP4 metadata is moved to the front (`faststart`) so playback can begin before a whole file downloads.

| Title | Runtime | Poster timestamp |
| --- | --- | --- |
| I Do Da Biness | 2:03 | 12.281 s |
| Leo Ghetto | 3:04 | 92.021 s |
| Nice and Neat | 3:33 | 195.828 s |
| OWO | 3:05 | 144.512 s |

The first and last titles were confirmed in opening title cards. The other titles come from the supplied filenames. Posters are actual source frames, cropped to remove letterboxing and fit 16:9, exported to 1280 × 720 WebP. The videos preserve the original framing and letterboxing.

The catalog is `app/full-music-video-catalog.ts`; media lives in `public/media/full-music-videos/`.

## Recreate web copies

Install FFmpeg with `libx264`, then run from the project directory:

```powershell
node scripts/encode-full-videos.mjs 'C:\path\to\original-video-folder'
```

The script matches the four original filenames, writes both sizes, preserves the originals, and checks output size. It can optionally use NVIDIA encoding when `AICANFEEL_VIDEO_ENCODER=h264_nvenc` and compatible drivers are available. Do not commit the 4K masters or replace the web copies with them.

## Validation

Before publishing, check all four videos, both quality options, seeking and original sound, pause/resume, fullscreen, close/switch cleanup, keyboard focus return, reduced motion, mobile layout, and loading/error recovery. Confirm there are no full-video requests before selection and that the deployed host honors byte-range requests for seeking.

Verified September 26, 2026: all four videos play at both resolutions and seek to one minute. Quality changes retain time, paused/playing state, mute, volume, and playback speed, including rapid changes. Close/switch cleanup, keyboard focus return, blocked-autoplay fallback, network-error retry, end/replay, fullscreen, and reduced motion pass. Viewports tested: 1440 × 1000, 390 × 844, 320 × 568, and 844 × 390 landscape; no horizontal overflow. No full-video files load before selection. These are browser viewport checks, not physical-device tests.

All eight copies pass format, duration, fast-start and file-size checks. Each AAC packet hash matches its original. The copies total 442,997,314 bytes (422.48 MiB); the largest is 85.59 MiB. See `FINAL-CHECK.md` for deployment verification.
