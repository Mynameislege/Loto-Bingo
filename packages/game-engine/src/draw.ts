// ─── Ball drawing ─────────────────────────────────────────────────────────

/** Generate a full shuffled sequence of 90 balls (server-side, done once per game) */
export function generateBallSequence(): number[] {
  const balls = Array.from({ length: 90 }, (_, i) => i + 1);
  for (let i = balls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [balls[i]!, balls[j]!] = [balls[j]!, balls[i]!];
  }
  return balls;
}

/**
 * Draw the next ball from a pre-generated sequence.
 * Returns null if all balls have been drawn.
 */
export function drawNextBall(
  sequence: number[],
  drawnCount: number,
): number | null {
  if (drawnCount >= sequence.length) return null;
  return sequence[drawnCount] ?? null;
}
