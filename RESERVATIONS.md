# Studio reservations

The user-supplied reservation amount is **$99 USD**, fully credited toward the project deposit. It is not an additional fee. Total project pricing and refund/rescheduling terms have not been supplied; the site does not invent them.

## Current state

- The Instagram contact section is replaced by the reservation section at `#reserve`.
- `app/reservation-config.ts` owns the amount, remaining capacity, and checkout URL.
- `checkoutUrl: null` means checkout is not open. The displayed button is disabled and the reason is visible.
- `remainingSlots: null` shows “Limited studio availability”. A real remaining count can be entered once confirmed. There is no time-based decrement or invented booking activity.
- Email contact is a standard `mailto:aicanfeel@gmail.com` footer link.

## When the payment link arrives

1. Verify that the destination belongs to the studio and charges $99 USD for a reservation credited toward the project deposit.
2. Add its public HTTPS URL to `checkoutUrl`, and set genuine remaining capacity if provided. Only HTTPS URLs are accepted.
3. Configure real payment confirmation and booking fulfillment with that provider before promising a confirmed place. This static site does not process payments, receive webhooks, decrement stock, or send confirmations.
4. For automatic availability, use verified paid orders and a backend/provider inventory limit. Do not infer a booking from clicking the payment link or from a payment success query parameter.
5. Rebuild, test the checkout destination, and publish.

The count is a maintained studio capacity display until connected to an authoritative booking service. The animated glints are decoration and never indicate new purchases.

## Graphics budget

The reservation optics initialize near the viewport, cap render resolution and frame rate, and pause when offscreen, hidden, or a viewer is open. Reduced motion receives a still composition; CSS material styling remains available without WebGL. All business content is regular HTML, independent of graphics.
