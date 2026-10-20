# Portrait portfolio media

Updated 20 October 2026. `app/portrait-media.json` is the shared source for portfolio order, titles, asset names, and duration. The app, media preparation, waveform generation, and static-export checks all read this catalog.

| Order | Display title | Video / cover | Waveform |
| --- | --- | --- | --- |
| 1 | AICANFEEL 2.0 | aicanfeel-2.mp4 / aicanfeel-2.webp | wave-7.json |
| 2 | Future vision | film-1.mp4 / cover-1.webp | wave-1.json |
| 3 | Another world | film-2.mp4 / cover-2.webp | wave-2.json |
| 4 | Love in motion | film-3.mp4 / cover-3.webp | wave-3.json |
| 5 | Brand vision | brand-vision.mp4 / brand-vision.webp | wave-6.json |

All assets above live in `public/media`. Seeing red and After hours and their optimized assets were removed from the current deployment; they remain recoverable in Git history. The four full-length music videos are unchanged.

## October replacements

- AICANFEEL 2.0 source: `C:\Users\prana\Downloads\Aicanfeel 2.0.MOV`. Its supplied cover is `C:\Users\prana\Downloads\ChatGPT Image Oct 16, 2026, 06_28_00 PM.png`. The pink-haired performer, red coat, palm trees, and supporting performers match the footage's Miami scene. It is promotional artwork, not a verified exact frame.
- Brand vision source: `C:\AI stuff new\ALL AD CONTENT\Seedance ads\FInal Ready ADs\Website\Website Ad 6.mp4`. Its supplied cover is `C:\Users\prana\OneDrive\Desktop\1000k Business Ad 4k 60.00_00_47_29.Still002.png`. The helmeted performer, pink car, red forest, and black tree match the final sequence. It is supplied scene-matched artwork.
- Original source files are unchanged. New copies are H.264, 720×1280 portrait, 30 fps, yuv420p, with faststart metadata before media data. The original AAC stereo streams are copied bit for bit, with matching SHA-256 hashes. The 60 fps originals remain available for masters.
- AICANFEEL 2.0: 14,556,336 bytes (14.56 MB), 27.833 seconds; approximately 76.5% smaller than the 62.0 MB source.
- Brand vision: 16,397,827 bytes (16.40 MB), 39.083 seconds; approximately 93.3% smaller than the 246.17 MB source. The slight duration rounding follows the 30 fps web-copy timeline.
- Both covers are optimized 720×1280 WebP, about 200 KB each. No black padding was added. The player uses the actual inner portrait ratio; covers fill it while video uses `contain` to preserve the full frame.
- Both video/audio streams passed complete FFmpeg decode checks. Waveforms are regenerated from the actual optimized videos using `node scripts/prepare-waveforms.mjs`; they load only on selection.
