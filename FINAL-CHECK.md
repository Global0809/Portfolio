# Neural face scan — 27 September 2026

- Added a generic anatomical point-cloud face behind the existing feature interlude at `#face-scan`. A moving cross-section follows the actual face surface, with cool acquisition light, warm afterglow, restrained rotation, and touch/scroll response. It uses no camera or face capture.
- Desktop and 390/320px browser renders show the complete face, readable copy, and no horizontal overflow. Independent finish review returned “Ship.” The decorative canvas stays out of the accessibility tree and does not intercept touch or keyboard input.
- Browser checks pass for lazy geometry loading (no face mesh or video requests at the top of the mobile page), 3,200 mobile particles, offscreen and hidden-page pausing, full-video playback pausing the face, close/resume, WebGL context loss/recovery, reduced motion, Save-Data, unavailable WebGL, and a failed geometry request. Static fallbacks load successfully; completed flows have zero page errors. Mobile verification used emulated Chrome viewports, not physical devices.
- The existing Three.js dependency is reused. The renderer caps at 24 fps on phones / 30 fps on desktop, DPR 1.25 and 550,000 canvas pixels; no post-processing or additional graphics library. Mesh JSON is 22 KB and the matching still is 26 KB. Source and Apache 2.0 attribution are documented in `docs/NEURAL-FACE-ASSET.md` and shipped beside the assets.
- TypeScript, targeted lint, and Node 22 production build pass. The one design scan reported advisory palette/type entries in the existing feature stylesheet; the established colors/type are intentionally retained, with lower-opacity glass for the new desktop overlap. The existing Three.js chunk-size warning remains.
- Production browser checks also pass at 768px and 844px landscape with no overflow. Changing reduced-motion preference stops actual draw calls and restores the still; portrait video playback pauses the scan, and Escape returns focus correctly.

---

# Screening and reservation redesign — 27 September 2026

Live: **https://aicanfeelweb.com/#reserve**. Pages commit `3fb3cdc9fdab65c98ae4c4eaa8226a86c6713117`, deployment run `36276018665`: successful. Public browser check confirms new highlights, no Instagram invitation, $99 reservation/disabled checkout, footer email, working WebGL, and mobile video playback/seek/filmstrip/close with zero page errors.

- Replaced the four icon cells with an editorial feature composition and optical diagrams. Rebuilt the full-video collection and its full-screen viewing room with a selected-video atmosphere, thumbnail filmstrip, glass navigation and playback-linked sound indicator.
- Replaced the closing Instagram invitation with a WebGL studio reservation pass. $99 USD is explicitly credited in full to the project deposit. Checkout is visibly unavailable until the studio supplies its real payment link. A true capacity count is still unconfirmed, so the display reads “Limited studio availability”; no timer-based inventory or simulated sales exist.
- Added the visible footer email `aicanfeel@gmail.com` and connected the portrait-video completion CTA to the reservation section.
- Chrome checks at 1440×1000, 390×844, 320×568, 768×1024 and 844×390 found no horizontal overflow. All four full videos play with native controls; phones default to 720p. Seeking, HD switching with position/pause/mute retention, filmstrip selection, Escape, close cleanup, and focus return pass. No full-video file downloads before selection. No browser page errors in the completed flow.
- Checked reduced motion, viewport exit, video-modal pausing, and WebGL-disabled fallback. The reservation stops rendering offscreen, caps resolution/frame rate and has no animation-driven React state updates. Fallback preserves all business content.
- Initial visual review found ticket clipping and aliasing; the renderer fit, depth separation and antialiasing were corrected. The independent finish reviewer scored that fix resolved and returned “Ship” for the reviewed scope. The one mechanical design scan returned no findings.
- TypeScript, targeted lint, and Node 22 static production build pass. Existing Three.js large-chunk warning remains; no additional graphics library, streaming service or media asset was added. Original source footage and optimized media files are unchanged. Mobile validation used browser viewports, not physical devices.
- The production preview also passes native fullscreen entry/exit and the portrait-video end-to-reservation journey. A pre-existing pointer-event rule was corrected so the end-screen link accepts taps. No page errors in the completed production check.

---

# Full music videos — 26 September 2026

Live section: **https://aicanfeelweb.com/#full-music-videos**

- Published four full music videos immediately above the Instagram invitation, using first-party MP4 playback instead of Mux. GitHub Pages deployment `40feca49c35b7236ead7c00b158e2c227fd38269` completed successfully.
- All eight public MP4 URLs return `206`, `video/mp4`, the expected byte ranges and file lengths. The live site played and sought all four 720p videos without login; desktop 1080p playback also passed. No media files loaded before selection, and no player remained after closing. No browser page errors.
- Local browser checks passed for every video at both resolutions, paused/playing quality changes without losing position, rapid quality switching, mute/volume/rate preservation, previous/next cleanup, keyboard focus return, blocked-autoplay fallback, failed-load retry, end/replay, fullscreen and reduced motion. Layout checked at 1440 × 1000, 390 × 844, 320 × 568 and 844 × 390. Mobile checks use emulated browser viewports, not physical devices.
- All eight web copies preserve original duration/composition, use H.264/yuv420p at 30fps, and have fast-start metadata. Every AAC packet hash matches its 4K master exactly; originals remain unchanged.
- TypeScript, targeted lint and the Node 22 production build passed. The existing large Three.js chunk warning remains. The published artifact is 529,358,009 bytes, below Pages' 1 GB limit; every video is below 95 MiB. The Pages soft bandwidth limit remains 100 GB/month.
- Packaging now reuses generated files through hard links where supported, with a cross-volume copy fallback. Temporary deployment checkouts reuse local Git objects to avoid duplicating the video storage.

---

# Custom-domain delivery — 24 September 2026

Live website: **https://aicanfeelweb.com/**

- Rebuilt the static website with root-relative assets and the new canonical URL.
- Added public/CNAME and a packaging check to preserve the custom domain across future deployments.
- TypeScript and the Node22 production build passed.
- The local root preview loaded in the browser without console errors; all generated JavaScript, CSS, fonts and covers returned200. All five MP4s supported206 byte-range requests.
- Hostinger now has all four GitHub Pages A records and the www CNAME. GitHub's custom domain is set to aicanfeelweb.com; the root-path build is published. Authoritative DNS confirms the records; existing MX/SPF/DKIM/DMARC records were preserved. The HTTPS certificate is approved for both aicanfeelweb.com and www.aicanfeelweb.com; HTTPS enforcement is enabled.

- Verified HTTPS200 for the portfolio and all15 linked assets, with206 video range responses for all five films. The custom-domain browser played Seeing red and returned to the portfolio without console errors.
- HTTP, www and the original github.io/Portfolio address all return301 redirects to https://aicanfeelweb.com/.

---

# GitHub Pages delivery — 11 September 2026

Live website: **https://global0809.github.io/Portfolio/**

## Completed checks

- TypeScript and the static export passed. The production build was run using Node 22; the packaged output is in pages-dist.
- GitHub Pages reports the gh-pages deployment as built and public, with HTTPS enforced. Anonymous requests to the website, CSS, JavaScript, fonts and covers return 200.
- All five public MP4 endpoints support byte-range requests (206), allowing seeking without downloading each entire video first.
- All five music videos played in the static production preview. The check covered selection, replay, play/pause, mute, seeking, fullscreen, and returning to the portfolio. Only one video existed during playback, and none remained after closing.
- The Instagram message link opened the AICANFEEL conversation. No message was composed or sent. A separate profile link is available beside the verified badge and supplied follower count.
- The new invitation was inspected at 320 × 568, 390 × 844 and 1440 × 1000. The phone CTA is 58px tall, no horizontal overflow was found, and the decorative orbit pauses offscreen. Reduced-motion mode was checked.
- The booking forms, availability counters, reservation/studio routes, API, database schema, email setup and booking dependencies were removed from this version.
- Existing video audio, mobile rendering caps, touch interactions, shader/scan effects, entrance, sound preferences and capability highlights are retained.
- This version is separate from the earlier chatgpt.site preview, which was not changed by this deployment.

## Practical limits

- Instagram may require the visitor to sign in or open its app to message the studio.
- Browser sound starts after deliberate interaction. Saved mute and reduced-motion preferences are respected.
- Mobile checks used browser viewports, not physical iOS/Android devices. The supplied videos have no separate caption tracks.
- The existing lazy-loaded Three.js chunk still triggers a build-size warning. The repository's strict lint baseline is not clean; TypeScript and production-build checks are separate.
- Existing npm audit findings concern build/server packages. This deployment serves static files only and has no public Node, RSC or application API server. Future dependency updates should be tested before publishing.
- Use Node 22 LTS for builds. Windows Node 24 can hit an upstream shutdown assertion after Vinext prerendering.
