# Studio reservations

“Reserve slot” opens the studio's Instagram conversation at [@aicanfeel](https://ig.me/m/aicanfeel). The studio confirms availability and plans the music video in chat. Pricing is hidden for now.

## Current state

- The reservation section is at `#reserve`; its active link uses `studio.instagramMessageUrl` from `app/studio-config.ts`.
- The pass reads “A place for your music.” and shows `@aicanfeel`. Supporting copy explains that the studio will confirm availability on Instagram.
- `app/reservation-config.ts` owns remaining capacity.
- `remainingSlots: null` shows “Limited studio availability”. A real remaining count can be entered once confirmed. There is no time-based decrement or invented booking activity.
- Email contact is a standard `mailto:aicanfeel@gmail.com` footer link.

If a confirmed count reaches zero, the section says “This intake is full” and the active link reads “Ask about the next slot”. Opening Instagram does not confirm a reservation. The static site does not process payments, decrement capacity, or send confirmations. Animated glints are decorative.

## Graphics budget

The reservation optics initialize near the viewport, cap render resolution and frame rate, and pause when offscreen, hidden, or a viewer is open. Reduced motion receives a still composition; CSS material styling remains available without WebGL. All business content is regular HTML, independent of graphics.
