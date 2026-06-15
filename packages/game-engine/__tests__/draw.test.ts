import { generateBallSequence, drawNextBall } from '../src/draw';

describe('generateBallSequence', () => {
  it('returns 90 balls', () => {
    expect(generateBallSequence()).toHaveLength(90);
  });

  it('contains all numbers 1-90 exactly once', () => {
    const seq = generateBallSequence();
    const sorted = [...seq].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 90 }, (_, i) => i + 1));
  });

  it('is shuffled (not always in order)', () => {
    // Run 5 times — astronomically unlikely to always be sorted
    const results = Array.from({ length: 5 }, () => {
      const seq = generateBallSequence();
      return seq.every((v, i) => v === i + 1);
    });
    expect(results.every(Boolean)).toBe(false);
  });
});

describe('drawNextBall', () => {
  it('returns the ball at position drawnCount', () => {
    const seq = [42, 7, 15, 3];
    expect(drawNextBall(seq, 0)).toBe(42);
    expect(drawNextBall(seq, 1)).toBe(7);
    expect(drawNextBall(seq, 3)).toBe(3);
  });

  it('returns null when all drawn', () => {
    const seq = [1, 2, 3];
    expect(drawNextBall(seq, 3)).toBeNull();
    expect(drawNextBall(seq, 99)).toBeNull();
  });
});
