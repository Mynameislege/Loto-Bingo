import { CelebrationEvent, TensionLevel } from '@loto-seniors/host-content';

export type SeasonalEvent =
  | 'noel' | 'paques' | '14juillet' | 'beaujolais'
  | 'fete_meres' | 'fete_peres' | 'journee_seniors'
  | 'galette' | 'chandeleur' | 'armistice' | 'avent'
  | null;

export interface SelectionContext {
  /** The ball just drawn (1-90). Required for number_call. */
  ballDrawn?: number;

  /** Current game progress */
  ballsDrawnCount: number;
  totalBalls: number; // usually 90

  /** Game result event to announce */
  celebrationEvent?: CelebrationEvent;

  /** Tension — player is N numbers away from next milestone */
  tensionLevel?: TensionLevel;

  /** Filler moment between balls */
  isFiller?: boolean;

  /** Opening or closing the game */
  isOpening?: boolean;
  isClosing?: boolean;

  /** Game ended without a win */
  isEndNoWin?: boolean;

  /** Personal triggers */
  personalTrigger?: string;

  /** Seasonal event active right now */
  seasonalEvent?: SeasonalEvent;

  /** Whether the Bingo was in daily mode (for bingo_daily variant) */
  isDailyBingo?: boolean;
}

export interface EngineSession {
  /** IDs of the last N phrases used — anti-repetition window */
  recentPhraseIds: string[];
  /** Max size of the anti-repetition window */
  windowSize: number;
}

export interface SelectedPhrase {
  id: string;
  text: string;
  /** Relative path on Cloudflare R2: audio/{id}.mp3 */
  audioKey: string;
}
