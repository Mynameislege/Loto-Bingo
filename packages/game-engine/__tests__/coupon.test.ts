import { shouldAwardCoupon, dailyBingoProbability } from '../src/coupon';

describe('shouldAwardCoupon', () => {
  describe('daily mode', () => {
    const config = { mode: 'daily' as const, dailyBallLimit: 70 };

    it('awards coupon on Bingo within limit', () => {
      expect(shouldAwardCoupon(config, 65, true)).toBe(true);
      expect(shouldAwardCoupon(config, 70, true)).toBe(true);
    });

    it('does not award coupon on Bingo beyond limit', () => {
      expect(shouldAwardCoupon(config, 71, true)).toBe(false);
      expect(shouldAwardCoupon(config, 85, true)).toBe(false);
    });

    it('does not award coupon without Bingo', () => {
      expect(shouldAwardCoupon(config, 50, false)).toBe(false);
    });
  });

  describe('multiplayer modes', () => {
    it('awards coupon to first Bingo in public room', () => {
      const cfg = { mode: 'multiplayer_public' as const, dailyBallLimit: 90, isFirstBingo: true };
      expect(shouldAwardCoupon(cfg, 80, true)).toBe(true);
    });

    it('does not award coupon to non-first Bingo', () => {
      const cfg = { mode: 'multiplayer_public' as const, dailyBallLimit: 90, isFirstBingo: false };
      expect(shouldAwardCoupon(cfg, 80, true)).toBe(false);
    });

    it('awards coupon in family room for first Bingo', () => {
      const cfg = { mode: 'multiplayer_family' as const, dailyBallLimit: 90, isFirstBingo: true };
      expect(shouldAwardCoupon(cfg, 75, true)).toBe(true);
    });
  });

  describe('campaign and free modes', () => {
    it('never awards coupon in campaign', () => {
      const cfg = { mode: 'campaign' as const, dailyBallLimit: 90 };
      expect(shouldAwardCoupon(cfg, 60, true)).toBe(false);
    });

    it('never awards coupon in free mode', () => {
      const cfg = { mode: 'free' as const, dailyBallLimit: 90 };
      expect(shouldAwardCoupon(cfg, 60, true)).toBe(false);
    });
  });
});

describe('dailyBingoProbability', () => {
  it('returns a probability between 0 and 1', () => {
    const p = dailyBingoProbability(70);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('is ~30% for limit=70 (design target)', () => {
    const p = dailyBingoProbability(70);
    // Exact value varies by formula; check it is in reasonable range 20-40%
    expect(p).toBeGreaterThan(0.20);
    expect(p).toBeLessThan(0.40);
  });

  it('increases with higher ball limit', () => {
    expect(dailyBingoProbability(80)).toBeGreaterThan(dailyBingoProbability(70));
    expect(dailyBingoProbability(90)).toBeGreaterThan(dailyBingoProbability(80));
  });
});
