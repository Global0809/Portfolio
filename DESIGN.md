---
name: AICANFEEL
description: A cinematic music-video portfolio in dark glass, silver ice, and champagne light.
colors:
  background: "#060709"
  foreground: "#f2f3f3"
  primary: "#d6e0e8"
  muted: "#20262d"
  ring: "#b5d6ed"
  muted-foreground: "#a5afb9"
  glint-cool: "#bdd9eb"
  glint-warm: "#dfc2a6"
  text-secondary: "#c1c8ce"
  glass-edge: "#d4e2ed3d"
  glass-highlight: "#f4f7f946"
  reserve-paper: "#efe4d5"
  reserve-ink: "#f0f3f5"
  reserve-soft: "#afc0ca"
  screening-background: "#070a0e"
typography:
  display:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(42px, 11.8vw, 70px)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.065em"
  headline:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(29px, 7vw, 49px)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  feature-emphasis:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  reservation-headline:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(30px, 8.3vw, 48px)"
    fontWeight: 500
    lineHeight: 1.16
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(15px, 3.8vw, 18px)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  featured-title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(31px, 8vw, 42px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.025em"
  screening-title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(35px, 8.5vw, 64px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  reservation-copy:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.14em"
rounded:
  thumbnail: "6px"
  cover: "8px"
  screen: "10px"
  action: "12px"
  featured-cover: "14px"
  pass-fallback: "16px"
  pill: "30px"
  circle: "50%"
spacing:
  page-gutter: "6%"
  page-gutter-wide: "4.5%"
  inline-gap: "12px"
  filmstrip-gap: "9px"
components:
  reservation-button:
    textColor: "#111b22"
    rounded: "{rounded.action}"
    padding: "18px 23px"
    width: "100%"
  screening-switch:
    textColor: "#e6f1f8"
    rounded: "{rounded.circle}"
    height: "44px"
    width: "44px"
  quality-select:
    backgroundColor: "#ffffff07"
    textColor: "#e5edf4"
    rounded: "{rounded.cover}"
    padding: "0 9px"
  screening-nav:
    textColor: "#dce6ed"
    width: "100%"
  watch-affordance:
    textColor: "#cfdee8"
    rounded: "{rounded.pill}"
    padding: "0 13px"
  reservation-pass:
    textColor: "#edf3f5"
    rounded: "{rounded.pass-fallback}"
  studio-signatures:
    textColor: "#aebdc9"
    width: "100%"
---

# Design System: AICANFEEL

## Overview

**Creative North Star: "A studio in spectral glass"**

The site presents the studio's films inside a dark, cinematic environment. Silver ice and champagne reflections make controls and objects feel tangible, while the supplied footage carries the strongest imagery. Manrope gives the interface clarity; Cormorant Garamond brings a lyrical voice to selected titles and phrases.

Preserve the established shader background and liquid glass identity. The compact feature strip, full-video gallery, screening room, and reservation pass are different expressions of that same material world. Their layouts are component-specific; they do not establish a mandatory composition for every future page.

**Key Characteristics:**

- Dark continuous space with fine optical edges.
- Cool silver light balanced by warm champagne highlights.
- Clear sans-serif controls paired with expressive serif emphasis.
- Supplied films lead; a compact icon-and-text strip presents the four studio features.
- Motion supports the experience and has a static fallback.

This is an extraction of the implemented public site, including the restored compact feature strip. The normative values above come from the active stylesheet cascade in `app/layout.tsx`, especially `globals.css`, `midnight.css`, `release-polish.css`, `signal-details.css`, `studio-reservation.css`, and `full-music-videos.css`. Earlier light-theme declarations and unused booking-form styles are not design authority. Product and commercial truth remains in `PRODUCT.md` and the configuration files.

## Colors

### Primary

**Silver ice** uses the primary and cool-glint tokens for reflective controls, fine edges, and active emphasis. The ring token is the global keyboard-focus color. Use these as light within a dark environment, with restrained translucent fills.

### Secondary

**Champagne light** uses the warm-glint token for reflected warmth. The reservation paper token gives the reservation's serif phrase and Instagram icon a warmer focal color. These are material accents, not success or warning colors.

### Neutral

**Carbon** is the page background; the screening room has its own closely related dark surface. Foreground and secondary text separate primary content from supporting copy. Muted surfaces, glass edges, and highlights define layers without obscuring the shader or media. Reservation ink and soft text are local tokens scoped to that section.

Alpha-bearing edge and highlight tokens remain translucent. The sidecar's generated tonal ramps are panel aids, not additional production colors.

**The Material Continuity Rule.** Preserve the dark foundation, cool silver light, and champagne reflections across new work.

## Typography

**Display and interface font:** Manrope, with Arial and sans-serif fallbacks.
**Expressive font:** Cormorant Garamond, with Georgia and serif fallbacks.

The font pairing is pinned. Serif emphasis is used inside headlines and for selected film titles; navigation, controls, metadata, and supporting copy remain sans-serif. Runtime figures use tabular numerals.

The frontmatter records the base mobile-first roles, not a generated modular scale. The hero display has a larger desktop override from 1100px and a smaller setting at 360px or below. Section headings use their own fluid values. At 680px, the featured gallery title and screening title receive desktop values; the reservation heading changes at 761px. The feature strip uses 12px labels and 15px emphasis, with 11px/13px sizes at 360px or below and 18px emphasis from 761px.

The feature strip's “Our creativity” phrase uses italic Cormorant at 24px, 21px at 360px or below, and 26px from 761px. “4K UHD” uses 25px Manrope. The reservation's italic serif phrase uses 1.34em. Do not apply the small, tracked eyebrow style to body copy.

## Layout

The public archive is a continuous page with percentage gutters. The wider gutter token applies below 761px; the wide-screen gutter token applies from that breakpoint. There is no single max-width or spacing scale governing every section.

- **Feature strip:** four icon-and-text cells form a two-by-two grid on mobile and one row of four equal columns from 761px. The strip has a 28px top margin, increasing to 38px at that breakpoint, with fine dividers between cells.
- **Full-video gallery:** one large featured film followed by three compact rows on mobile. From 680px, the featured film occupies the left column and the three remaining films occupy the right. The column ratio grows from 1.4:1 to 1.62:1 at 1000px. All film covers remain 16:9.
- **Full-video screening room:** a full-viewport dialog with safe-area padding, title, previous/next controls, a contained 16:9 picture, native playback controls, quality selection, and a four-film strip. Desktop sizing also responds to viewport height. A short landscape viewport moves metadata and thumbnails beside the picture.
- **Reservation:** copy, pass, and action stack on mobile. From 761px, the copy and action occupy the left column while the pass spans the right; this composition caps at 1400px. The action area caps at 470px.
- **Footer:** contact and studio information wrap naturally. The reservation section provides the Instagram conversation link; the former floating booking dock is removed.

Interactive player controls and the quality selector provide at least 44px targets. The reservation action is larger, with a 62px minimum height. Tiny visible play symbols inside covers are part of the complete clickable film card, not separate small targets.

## Elevation & Depth

Depth comes from translucent layers, narrow bright rims, inward highlights, soft dark shadows, and real-time optical material. The film gallery stays largely open and flat; the media frame and controls carry the glass detail. The selected film's blurred poster lights the screening-room background without covering the picture.

The reservation pass has a beveled WebGL object behind live HTML text. The CSS fallback keeps a dark reflective plate when graphics are unavailable or data saving bypasses WebGL. The invitation and Instagram handle remain real text.

The sidecar records exact shadow and motion values. Material animations pause where the implementation tracks visibility, page visibility, or paused effects. Reduced-motion rules remove light accents and transition animations. The screening waveform is decorative playback feedback; it runs only while playback is active and unmuted.

**The Optional Motion Rule.** Keep content and controls usable when animation or WebGL is unavailable.

## Shapes

Small-radius rectangular media frames establish the gallery; the featured cover is slightly softer than compact covers. Circular transport controls read as physical controls. The reservation action is a rounded rectangle, and secondary watch affordances use pill outlines.

Fine borders and inset edge highlights define the glass. The feature strip is a compact surface with square outer corners, top and bottom borders, and thin cell dividers. Each cell pairs a small line icon with the supplied wording.

## Components

### Reservation action

A full-width silver-to-champagne action sits below “Start with your song.” and the invitation to discuss availability on Instagram. Its gradient, inset edges, and shadow are documented in the sidecar because they are not color primitives.

The active “Reserve slot” link opens `studio.instagramMessageUrl` (`https://ig.me/m/aicanfeel`) and brightens on hover. Its note reads “Opens @aicanfeel on Instagram.” The studio confirms availability in chat. When the confirmed capacity is zero, the link stays active with “Ask about the next slot”. Pricing is hidden.

Capacity indicators render only when a confirmed positive count is configured. With the current null count, the section shows general limited availability and no numbered place lights.

### Film cards and watch affordances

A featured landscape cover leads the collection with a serif title and a small Watch pill. Subsequent films use compact cover-and-title rows. All entries open the same screening room; desktop hover gently enlarges the cover, brightens its rim, and advances the arrow.

Use supplied posters and the actual film title and duration. Full video files load after selection. Preserve the original sound and the existing 720p/1080p choice.

### Screening controls and field

Previous and next controls are circular glass buttons. The native quality select has a dark translucent fill, a fine border, and readable text. The active thumbnail receives a clear rim and full opacity; selection is also exposed semantically.

Loading, blocked playback, slow loading, and failure states have visible copy and recovery controls. Closing the dialog returns focus to the gallery. The global focus outline is the ring token at 2px with a 5px offset; the full-video stylesheet also declares a local cool focus color, but the global important outline wins for color and width.

### Navigation

The masthead pairs the wordmark and verified mark with sound and Portfolio controls. Sound state is exposed with its pressed state; the Portfolio link targets the portrait film index. The screening toolbar provides a Back control and the studio wordmark. The footer contact is a visible email link.

### Studio feature strip

The original four cells read “Perfect Lipsync”, “4K UHD”, “Perfect Face accuracy”, and “Your song, Our creativity”. AudioLines, MonitorPlay, ScanFace, and Sparkles icons appear at 21px with a 1.2 stroke width. The strip is a semantic list labelled “Made for your music”; the icons and short light accents are decorative.

The dark blue-to-black surface and the original spacing, text hierarchy, and fine dividers come from `app/signal-details.css`. Short light accents run on staggered six-second cycles while the strip is visible and effects are active; the lipsync icon has a 3.5-second pulse. Offscreen, hidden-page, modal, and reduced-motion states stop these effects. The retained `#face-scan` anchor supports existing bookmarks to the restored strip.

### Reservation pass

The pass separates decorative material from the readable brand, “A place for / your music.” invitation, and Instagram icon with `@aicanfeel`. The CSS material fallback is included as a representative card specimen. It is a fallback view, not a replacement for the production WebGL object.

## Do's and Don'ts

### Do:

- **Do** keep Manrope and Cormorant Garamond in their established interface and expressive roles.
- **Do** use the supplied footage and posters as the portfolio's primary imagery.
- **Do** preserve visible keyboard focus, touch targets, reduced-motion behavior, and no-WebGL fallbacks.
- **Do** keep the reservation invitation, Instagram handle, and availability readable as real text.
- **Do** follow each component's responsive layout rather than forcing a single card grid everywhere.

### Don't:

- **Don't** replace the dark shader, silver ice, champagne light, or liquid glass identity.
- **Don't** introduce mascots or decorative human-face artwork.
- **Don't** obscure the selected film with decorative overlays.
- **Don't** display invented capacity, decrement availability on a timer, or imply that opening Instagram confirms a reservation.
- **Don't** promote unused legacy styles or synthesized tonal ramps into production tokens.
