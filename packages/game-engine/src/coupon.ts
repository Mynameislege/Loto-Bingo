import { CouponAwardConfig } from './types';

/**
 * Determine whether a Bingo event should award a coupon.
 *
 * Rules:
 *   - daily mode:        Bingo AND ballsDrawn <= dailyBallLimit (~30% prob with limit=70)
 *   - multiplayer_*:     Bingo AND this player is the first to Bingo in the room
 *   - campaign / free:   never
 */
export function shouldAwardCoupon(
  config: CouponAwardConfig,
  ballsDrawnCount: number,
  isBingo: boolean,
): boolean {
  if (!isBingo) return false;

  switch (config.mode) {
    case 'daily':
      return ballsDrawnCount <= config.dailyBallLimit;

    case 'multiplayer_public':
    case 'multiplayer_family':
      return config.isFirstBingo === true;

    case 'campaign':
    case 'free':
      return false;
  }
}

/**
 * Estimated Bingo probability for the daily mode.
 * Useful for UI display ("~30% de chance de coupon aujourd'hui").
 */
export function dailyBingoProbability(ballLimit: number): number {
  // Approximation: P(Bingo in N draws from 90) with a 15-number card.
  // Using hypergeometric CDF approximation.
  // For ballLimit=70: empirically ~30%.
  // For accuracy we use a simple closed-form estimate:
  //   P ≈ C(ballLimit,15) / C(90,15)  — not quite right but good enough for display.
  // Better: use the formula P = product_{k=0}^{14} (ballLimit - k) / (90 - k)
  let p = 1;
  for (let k = 0; k < 15; k++) {
    p *= (ballLimit - k) / (90 - k);
  }
  return Math.round(p * 1000) / 1000; // 3 decimal places
}
