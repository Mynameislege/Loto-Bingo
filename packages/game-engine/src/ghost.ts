import { GhostPlayer } from './types';
import { generateCard } from './card';

// French senior first names pool
const GHOST_NAMES = [
  'Jean-Pierre', 'Marie', 'Colette', 'Roger', 'Jacqueline',
  'Marcel', 'Simone', 'André', 'Monique', 'Bernard',
  'Françoise', 'Michel', 'Odette', 'René', 'Yvette',
  'Robert', 'Huguette', 'Georges', 'Paulette', 'Lucien',
];

let nameIndex = 0;

function nextGhostName(): string {
  const name = GHOST_NAMES[nameIndex % GHOST_NAMES.length] ?? 'Jean';
  nameIndex++;
  return name;
}

/**
 * Generate a ghost player with a valid card and a human-like reaction delay.
 * @param id - unique identifier for this ghost (e.g. 'ghost_1')
 */
export function generateGhostPlayer(id: string): GhostPlayer {
  return {
    id,
    displayName: nextGhostName(),
    card: generateCard(),
    // Random human delay between 1000ms and 3500ms
    reactionDelayMs: 1000 + Math.floor(Math.random() * 2500),
  };
}

/**
 * Fill a room to the target size with ghost players.
 * @param realPlayerCount - number of real players already in the room
 * @param targetSize - desired total room size (e.g. 10)
 */
export function fillWithGhosts(
  realPlayerCount: number,
  targetSize: number,
): GhostPlayer[] {
  const needed = Math.max(0, targetSize - realPlayerCount);
  return Array.from({ length: needed }, (_, i) =>
    generateGhostPlayer(`ghost_${i + 1}`),
  );
}
