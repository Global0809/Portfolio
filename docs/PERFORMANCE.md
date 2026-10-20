# Motion performance — 21 October 2026

## Changes

- Replaced the hero's 20 fps mobile / approximately 30 fps desktop cap with phase-preserving 60 Hz scheduling and elapsed-time interpolation. Rapid arrow clicks use functional state updates.
- Retained reflected beveled frames, while removing full-scene transmission behind opaque posters and reducing rounded geometry subdivisions. Upload all poster textures before revealing WebGL. Hide the duplicate CSS fan only after its crossfade.
- Bound rendering resolution independently of device DPR. Hero: 300k pixels on mobile / 620k on desktop. Background shader: 320k / 450k. Reservation retains its existing pixel budget.
- Background, reservation, and short neural acquisition transitions target 60 Hz. Offscreen, hidden-tab, modal, reduced-motion, and Save-Data behaviors remain supported.
- Cache scan-target inventories, batch geometry reads before highlight writes, skip unchanged attributes, and coalesce pointer/focus/selection measurements outside the synchronous input and React commit path.
- Memoize unrelated page sections so changing the active cover does not render the full-video gallery, reservation, feature strip, background, scroll meter, or entrance again.
- Prepare a silent, suspended audio context during startup idle time. Audio activation remains in a trusted gesture. This removes audio-device construction from the first arrow click; no video audio routing changes.
- Reservation initialization waits for 180 ms of scroll quiet, yields between geometry stages, and awaits asynchronous shader compilation. The CSS ticket remains visible. Partial setup is disposed on cancellation and can retry on return.

## Measurement

Instrumented Chromium production builds on the same Windows host. Record unique WebGL draw timestamps and Long Tasks while clicking six next/previous controls, 700 ms apart. These are browser render-cadence measurements, not physical-phone or compositor presentation guarantees. Original media stays 30 fps; this work concerns interface motion.

| Test | Before | After |
| --- | --- | --- |
| Desktop hero, 1440×900 | 28.9 fps; median 33.3 ms | approximately 60 fps; median 16.7 ms, p95 16.8 ms |
| Mobile viewport hero, 390×844 | 19.5 fps; median 50 ms | approximately 60 fps; median 16.7 ms, p95 16.8 ms |
| Background shader | 25.9 desktop / 22.3 mobile fps | 60 fps in both viewport tests |
| Hero under 4× CPU slowdown, DPR 3 mobile emulation | 46.4 fps before the final input/render optimizations | 59.4 fps, p95 22.2 ms; no Long Tasks |

The normal transition samples after audio preparation had no Long Tasks or intervals over 34 ms. The separate 4× CPU stress test reduced the shader to 58.7 fps. Active scrolling measured 58.4 fps with no Long Tasks after deferring reservation setup; its initial implementation produced a 143 ms setup task during scroll. Actual performance still depends on hardware, browser, thermal state, and other running applications.

## Behavior checks

Desktop and mobile-sized browsers: repeated arrows, wraparound, keyboard navigation, swipe selection, film playback, pause/play, Escape cleanup, and modal animation pause. No MP4 requests before selection. No horizontal overflow or page errors. The reservation and shader run near 60 Hz when visible, the hero stops offscreen, and reduced-motion mode produces no recurring WebGL draws. A no-WebGL DPR 3 mobile context keeps the fallback visible and selectable.

Sound creates no oscillators before interaction, activates after a gesture, stays silent after mute, and resumes after explicit enable. TypeScript, focused lint, independent lifecycle review, and Node 22 production build pass. Existing Three.js shader precision and bundle-size warnings are unchanged.
