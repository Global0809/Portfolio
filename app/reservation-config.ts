/** Public display settings. Update availability only from actual studio capacity.
 * Add the studio's HTTPS payment link when supplied; never put payment secrets here.
 * A hosted checkout must confirm payment before a reservation is confirmed.
 */
export const reservation: {
  amountUsd: number;
  remainingSlots: number | null;
  checkoutUrl: string | null;
} = {
  amountUsd: 99,
  remainingSlots: null,
  checkoutUrl: null,
};

export function reservationCheckoutUrl() {
  if (!reservation.checkoutUrl) return null;
  try {
    const url = new URL(reservation.checkoutUrl);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
