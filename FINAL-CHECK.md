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
