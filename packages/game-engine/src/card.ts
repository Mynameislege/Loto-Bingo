import { Card, Row, Cell } from './types';

// ─── French Loto card generation ──────────────────────────────────────────
// Rules (standard French Loto / bingo 90):
//   • 9 columns: col 0 → 1-9, col 1 → 10-19, ..., col 8 → 80-90
//   • 3 rows, 9 cells each → 5 numbers per row, 4 blanks per row
//   • Each column has 1, 2 or 3 numbers across the 3 rows (never 0, never 3 in col 0-7, col 8 can have 1-3)
//   • Total numbers on card: exactly 15

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

function columnNumbers(col: number): number[] {
  if (col === 0) return Array.from({ length: 9 }, (_, i) => i + 1);       // 1-9
  if (col === 8) return Array.from({ length: 11 }, (_, i) => i + 80);     // 80-90
  return Array.from({ length: 10 }, (_, i) => col * 10 + i);              // e.g. col1 → 10-19
}

export function generateCard(): Card {
  // Step 1: decide how many numbers per column (1 or 2), ensuring total = 15
  // With 9 columns and 15 numbers: distribute so sum = 15.
  // Simple approach: start with 1 per column (= 9), add 6 more across 6 random columns.
  const counts = new Array<number>(9).fill(1);
  const candidates = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 6);
  for (const c of candidates) {
    counts[c] = 2;
  }
  // counts now sums to 15 ✓

  // Step 2: for each column, pick `count` numbers from the column's range
  const colNumbers: number[][] = counts.map((count, col) =>
    shuffle(columnNumbers(col)).slice(0, count).sort((a, b) => a - b),
  );

  // Step 3: assign numbers to rows.
  // Each row must have exactly 5 numbers total (across 9 columns).
  // Constraint: each column's numbers must be spread across different rows.
  // Strategy: build a row-assignment matrix.

  // Row targets: each row gets 5 numbers.
  const rowSlots: [number, number, number] = [5, 5, 5]; // remaining slots per row
  // rowAssign[col] = array of row indices for each number in that column
  const rowAssign: number[][] = Array.from({ length: 9 }, () => []);

  for (let col = 0; col < 9; col++) {
    const count = counts[col] ?? 1;
    // Pick `count` distinct rows, preferring rows with remaining capacity
    const availableRows = shuffle([0, 1, 2].filter((r) => (rowSlots[r] ?? 0) > 0));
    const chosen = availableRows.slice(0, count);

    if (chosen.length < count) {
      // Fallback: retry (extremely rare — just regenerate)
      return generateCard();
    }

    for (const r of chosen) {
      rowAssign[col]!.push(r);
      rowSlots[r as 0 | 1 | 2]--;
    }
    // Sort chosen rows so numbers go in ascending order per column
    rowAssign[col]!.sort((a, b) => a - b);
  }

  // Step 4: build the 3×9 grid
  const grid: Cell[][] = [
    new Array<Cell>(9).fill(null),
    new Array<Cell>(9).fill(null),
    new Array<Cell>(9).fill(null),
  ];

  for (let col = 0; col < 9; col++) {
    const nums = colNumbers[col] ?? [];
    const rows = rowAssign[col] ?? [];
    for (let i = 0; i < nums.length; i++) {
      grid[rows[i]!]![col] = nums[i]!;
    }
  }

  return grid as Card;
}

/** Return all non-null numbers on a card */
export function cardNumbers(card: Card): number[] {
  return card.flatMap((row: Row) => row.filter((c): c is number => c !== null));
}

/** Validate card structure (useful in tests) */
export function validateCard(card: Card): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (card.length !== 3) errors.push('Card must have 3 rows');

  for (let r = 0; r < 3; r++) {
    const row = card[r];
    if (!row) { errors.push(`Row ${r} missing`); continue; }
    if (row.length !== 9) errors.push(`Row ${r} must have 9 cells`);

    const nums = row.filter((c): c is number => c !== null);
    if (nums.length !== 5) errors.push(`Row ${r} must have exactly 5 numbers, got ${nums.length}`);
  }

  // Column range checks
  for (let col = 0; col < 9; col++) {
    const vals = card.map((r) => r[col]).filter((c): c is number => c !== null);
    if (vals.length === 0) errors.push(`Column ${col} has no numbers`);
    if (vals.length > 3) errors.push(`Column ${col} has too many numbers`);

    const expected = columnNumbers(col);
    for (const v of vals) {
      if (!expected.includes(v)) errors.push(`Value ${v} in col ${col} is out of range`);
    }
  }

  // Total numbers
  const total = card.flat().filter((c) => c !== null).length;
  if (total !== 15) errors.push(`Card must have 15 numbers, got ${total}`);

  return { valid: errors.length === 0, errors };
}
