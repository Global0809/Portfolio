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
