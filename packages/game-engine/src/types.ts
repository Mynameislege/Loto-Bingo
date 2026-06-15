// ─── Card ──────────────────────────────────────────────────────────────────
// A Loto card is a 5×3 grid (5 columns, 3 rows) of numbers 1–90.
// Each cell is either a number or null (blank cell).
// Standard French Loto: each row has exactly 5 numbers out of 9 cells,
// spread across 9 columns (col i covers numbers [i*10+1 … i*10+10]).
export type Cell = number | null;
export type Row = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell]; // 9 cells
export type Card = [Row, Row, Row]; // 3 rows

// ─── Game State ────────────────────────────────────────────────────────────
export type GameMode = 'daily' | 'campaign' | 'multiplayer_public' | 'multiplayer_family' | 'free';

export interface GameState {
  mode: GameMode;
  ballsDrawn: number[]; // ordered list of drawn balls (1-90)
  card: Card;
  lineValidated: boolean;
  quineValidated: boolean;
  bingoValidated: boolean;
}

// ─── Check Results ─────────────────────────────────────────────────────────
export interface CheckResult {
  line: boolean;   // at least one complete row covered
  quine: boolean;  // at least two complete rows covered
  bingo: boolean;  // all three rows covered (= all 15 numbers)
}

// ─── Ghost Player ──────────────────────────────────────────────────────────
export interface GhostPlayer {
  id: string;
  displayName: string;
  card: Card;
  /** Human-delay before claiming (ms). Applied per check event. */
  reactionDelayMs: number;
}

// ─── Coupon award config ───────────────────────────────────────────────────
export interface CouponAwardConfig {
  mode: GameMode;
  /** For daily mode: max balls before Bingo no longer awards coupon */
  dailyBallLimit: number;
  /** Is this player the first to Bingo in their room? (multiplayer only) */
  isFirstBingo?: boolean;
}
