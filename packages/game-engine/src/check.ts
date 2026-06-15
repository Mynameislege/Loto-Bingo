import { Card, Row, CheckResult } from './types';

/** Set of drawn balls for O(1) lookup */
type DrawnSet = Set<number>;

function rowComplete(row: Row, drawn: DrawnSet): boolean {
  return row
    .filter((c): c is number => c !== null)
    .every((n) => drawn.has(n));
}

/**
 * Check Ligne, Quine, Bingo against the current set of drawn balls.
 * - Ligne : at least 1 complete row
 * - Quine : at least 2 complete rows
 * - Bingo : all 3 rows complete (= all 15 numbers covered)
 */
export function checkCard(card: Card, ballsDrawn: number[]): CheckResult {
  const drawn: DrawnSet = new Set(ballsDrawn);
  const completedRows = card.filter((row) => rowComplete(row, drawn)).length;

  return {
    line: completedRows >= 1,
    quine: completedRows >= 2,
    bingo: completedRows === 3,
  };
}

/**
 * Convenience: check a single row for completeness.
 */
export function checkRow(row: Row, ballsDrawn: number[]): boolean {
  const drawn: DrawnSet = new Set(ballsDrawn);
  return rowComplete(row, drawn);
}

/**
 * How many numbers on the card are already covered.
 * Useful for computing "closeness" for ghost player strategy.
 */
export function coveredCount(card: Card, ballsDrawn: number[]): number {
  const drawn: DrawnSet = new Set(ballsDrawn);
  return card
    .flat()
    .filter((c): c is number => c !== null && drawn.has(c)).length;
}
