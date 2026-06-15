import { generateGhostPlayer, fillWithGhosts } from '../src/ghost';
import { validateCard } from '../src/card';

describe('generateGhostPlayer', () => {
  it('produces a ghost with a valid card', () => {
    const ghost = generateGhostPlayer('ghost_1');
    const { valid } = validateCard(ghost.card);
    expect(valid).toBe(true);
  });

  it('has a reaction delay between 1000 and 3500ms', () => {
    for (let i = 0; i < 20; i++) {
      const ghost = generateGhostPlayer(`ghost_${i}`);
      expect(ghost.reactionDelayMs).toBeGreaterThanOrEqual(1000);
      expect(ghost.reactionDelayMs).toBeLessThanOrEqual(3500);
    }
  });

  it('has a non-empty display name', () => {
    const ghost = generateGhostPlayer('g1');
    expect(ghost.displayName.length).toBeGreaterThan(0);
  });
});

describe('fillWithGhosts', () => {
  it('fills to target size', () => {
    const ghosts = fillWithGhosts(3, 10);
    expect(ghosts).toHaveLength(7);
  });

  it('returns empty array when already at target', () => {
    expect(fillWithGhosts(10, 10)).toHaveLength(0);
  });

  it('returns empty array when over target', () => {
    expect(fillWithGhosts(12, 10)).toHaveLength(0);
  });

  it('each ghost has a unique id', () => {
    const ghosts = fillWithGhosts(0, 10);
    const ids = ghosts.map((g) => g.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('all ghost cards are valid', () => {
    const ghosts = fillWithGhosts(0, 10);
    for (const ghost of ghosts) {
      const { valid } = validateCard(ghost.card);
      expect(valid).toBe(true);
    }
  });
});
